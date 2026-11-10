import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductoTarjeta } from "@/lib/catalogo";
import type { Tarifa } from "@/lib/precios-calculo";

/*
 * Motor de listados: categoría, marca, nuevos y búsqueda usan esta misma función.
 * Los filtros viven en la URL para poder compartir enlaces:
 *   ?marca=hp,lenovo&sub=laptops-gaming&min=300&max=900&stock=1&orden=precio-asc&page=2
 */

export const POR_PAGINA = 24;

export const ORDENES = {
  relevancia: "Relevancia",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  nuevos: "Más nuevos",
} as const;
export type Orden = keyof typeof ORDENES;

export type Filtros = {
  marcas: string[]; // slugs de marca
  sub: string | null; // slug de subcategoría
  min: number | null; // precio CON IVA que ve el usuario
  max: number | null;
  soloStock: boolean;
  orden: Orden;
  pagina: number;
};

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Lee y limpia los filtros de la URL (cualquier valor raro se ignora). */
export function leerFiltros(sp: Params): Filtros {
  const numero = (v: string) => {
    const n = Number(v.replace(",", "."));
    return v !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const orden = uno(sp.orden);
  const pagina = Math.floor(Number(uno(sp.page)));
  return {
    marcas: uno(sp.marca)
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter((m) => /^[a-z0-9-]{1,60}$/.test(m))
      .slice(0, 20),
    sub: /^[a-z0-9-]{1,80}$/.test(uno(sp.sub)) ? uno(sp.sub) : null,
    min: numero(uno(sp.min)),
    max: numero(uno(sp.max)),
    soloStock: uno(sp.stock) === "1",
    orden: orden in ORDENES ? (orden as Orden) : "relevancia",
    pagina: Number.isFinite(pagina) && pagina >= 1 ? Math.min(pagina, 500) : 1,
  };
}

/** Contexto fijo de cada página (lo que NO depende de los filtros del usuario). */
export type Contexto = {
  categoriaIds?: string[]; // categoría (y sus subcategorías)
  marcaId?: string;
  soloNuevos?: boolean;
  texto?: string; // búsqueda libre
  facetaSubcategorias?: boolean; // mostrar filtro de subcategoría
};

const seleccionTarjeta = {
  id: true,
  slug: true,
  nombre: true,
  codigo: true,
  precioSinIva: true,
  precioDistribuidorSinIva: true,
  stock: true,
  destacado: true,
  nuevo: true,
  brand: { select: { nombre: true } },
  images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

/** Cada palabra buscada debe aparecer en el nombre, el código o la marca. */
function filtroTexto(texto: string): Prisma.ProductWhereInput[] {
  return texto
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 8)
    .map((p) => ({
      OR: [
        { nombre: { contains: p, mode: "insensitive" } },
        { codigo: { contains: p, mode: "insensitive" } },
        { brand: { nombre: { contains: p, mode: "insensitive" } } },
      ],
    }));
}

export async function listarProductos(ctx: Contexto, f: Filtros, tarifa: Tarifa) {
  // El distribuidor filtra y ordena por SU precio. Factor: del precio con IVA que ve el usuario al guardado sin IVA.
  const col = tarifa.esDistribuidor ? "precioDistribuidorSinIva" : "precioSinIva";
  const factor = 1 + tarifa.iva / 100;

  const base: Prisma.ProductWhereInput[] = [{ estado: "PUBLICADO" }];
  if (ctx.categoriaIds) base.push({ categoryId: { in: ctx.categoriaIds } });
  if (ctx.marcaId) base.push({ brandId: ctx.marcaId });
  if (ctx.soloNuevos) base.push({ nuevo: true });
  if (ctx.texto) base.push(...filtroTexto(ctx.texto));

  const porMarca: Prisma.ProductWhereInput[] = f.marcas.length ? [{ brand: { slug: { in: f.marcas } } }] : [];
  const porSub: Prisma.ProductWhereInput[] = f.sub ? [{ category: { slug: f.sub } }] : [];
  const porPrecio: Prisma.ProductWhereInput[] = [];
  if (f.min !== null) porPrecio.push({ [col]: { gte: f.min / factor } });
  if (f.max !== null) porPrecio.push({ [col]: { lte: f.max / factor } });
  const porStock: Prisma.ProductWhereInput[] = f.soloStock ? [{ stock: { gt: 0 } }] : [];

  const where: Prisma.ProductWhereInput = { AND: [...base, ...porMarca, ...porSub, ...porPrecio, ...porStock] };
  // Cada faceta se cuenta SIN su propio filtro (para poder elegir otra opción).
  const whereMarcas: Prisma.ProductWhereInput = { AND: [...base, ...porSub, ...porPrecio, ...porStock] };
  const whereSubs: Prisma.ProductWhereInput = { AND: [...base, ...porMarca, ...porPrecio, ...porStock] };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.orden === "precio-asc"
      ? [{ [col]: "asc" }]
      : f.orden === "precio-desc"
        ? [{ [col]: "desc" }]
        : f.orden === "nuevos"
          ? [{ createdAt: "desc" }]
          : [{ destacado: "desc" }, { nuevo: "desc" }, { createdAt: "desc" }];

  // Primero el total, para no pedir una página que no existe (?page=99 → última página).
  const total = await prisma.product.count({ where });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(f.pagina, paginas);

  const [filas, gruposMarca, gruposSub, rango] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [...orderBy, { id: "asc" }], // id: orden estable entre páginas
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: seleccionTarjeta,
    }),
    prisma.product.groupBy({ by: ["brandId"], where: whereMarcas, _count: { _all: true } }),
    ctx.facetaSubcategorias
      ? prisma.product.groupBy({ by: ["categoryId"], where: whereSubs, _count: { _all: true } })
      : Promise.resolve([]),
    prisma.product.aggregate({ where: { AND: base }, _min: { [col]: true }, _max: { [col]: true } }),
  ]);

  const [marcas, subcategorias] = await Promise.all([
    prisma.brand.findMany({
      where: { id: { in: gruposMarca.map((g) => g.brandId).filter((id): id is string => !!id) } },
      select: { id: true, nombre: true, slug: true },
      orderBy: { nombre: "asc" },
    }),
    gruposSub.length
      ? prisma.category.findMany({
          where: { id: { in: gruposSub.map((g) => g.categoryId) } },
          select: { id: true, nombre: true, slug: true, orden: true },
          orderBy: { orden: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const productos: ProductoTarjeta[] = filas.map((p) => ({
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    codigo: p.codigo,
    precioSinIva: Number(p.precioSinIva),
    precioDistribuidorSinIva: Number(p.precioDistribuidorSinIva),
    stock: p.stock,
    destacado: p.destacado,
    nuevo: p.nuevo,
    marca: p.brand?.nombre ?? null,
    imagen: p.images[0]?.url ?? null,
  }));

  const aVista = (v: Prisma.Decimal | null) => (v === null ? null : Math.round(Number(v) * factor * 100) / 100);

  return {
    productos,
    total,
    pagina,
    paginas,
    facetas: {
      marcas: marcas.map((m) => ({ ...m, cantidad: gruposMarca.find((g) => g.brandId === m.id)?._count._all ?? 0 })),
      subcategorias: subcategorias.map((s) => ({
        slug: s.slug,
        nombre: s.nombre,
        cantidad: gruposSub.find((g) => g.categoryId === s.id)?._count._all ?? 0,
      })),
      // Rango de precios (con IVA, según la tarifa) para orientar al usuario.
      precioMin: aVista(rango._min[col] ?? null),
      precioMax: aVista(rango._max[col] ?? null),
    },
  };
}

export type ResultadoListado = Awaited<ReturnType<typeof listarProductos>>;
