// Guardar un inventario subido y aplicarlo a la tienda.
// Recibe el cliente de Prisma como parámetro (sin "server-only") para que también lo use
// el script de la terminal `npm run inventario:reemplazar`.
//
// Reglas al APLICAR un inventario a la tienda (el inventario de la sucursal manda):
// - Producto del Excel que no existe en la tienda → se crea PUBLICADO, con categoría, marca y nombre
//   deducidos por `clasificar.ts`. El nombre, la categoría, la marca, fotos y descripción que luego
//   edites en el panel NO se pisan en las siguientes cargas.
// - Producto que ya existe (mismo código) → solo se actualizan stock y precio.
// - Precio (decisión del dueño, 10-nov-2026): NO se usa el PVP del Excel. Precio público sin IVA =
//   costo × (1 + utilidad_publico %). Si un producto viene sin costo, se usa su PVP como respaldo.
// - Producto de la tienda que NO está en el Excel → se oculta (BORRADOR, stock 0) con el motivo
//   `MOTIVO_OCULTO`. Si vuelve a aparecer en un inventario posterior, se publica otra vez solo.
// - Categorías: se muestran las que tienen productos publicados y se ocultan las vacías.
import { Prisma, type PrismaClient } from "@prisma/client";
import { CATEGORIAS, slugify } from "@/prisma/datos-base";
import { precioDesdeCosto } from "@/lib/precios-calculo";
import type { InventarioLeido } from "./leer-excel";
import { marcaProducto, nombreLegible, ubicarProducto } from "./clasificar";

export const MOTIVO_OCULTO = "No está en el inventario de la sucursal";

/** PVP con IVA → precio sin IVA con 4 decimales (así $15,00 vuelve a mostrarse como $15,00). */
export const pvpASinIva = (pvp: number, iva: number) => Math.round((pvp / (1 + iva / 100)) * 10_000) / 10_000;

/** El stock de la tienda es entero: 209,5 m de cable → 209; 0,5 → 0 (agotado). */
export const stockTienda = (stock: number) => Math.max(0, Math.floor(stock + 1e-9));

/** IVA y utilidad para el público (Admin → Configuración). */
async function leerPrecios(db: PrismaClient) {
  const filas = await db.setting.findMany({ where: { clave: { in: ["iva", "utilidad_publico"] } } });
  const valor = (clave: string, porDefecto: number) => {
    const v = filas.find((f) => f.clave === clave)?.valor;
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : porDefecto;
  };
  const iva = valor("iva", 15);
  const utilidad = valor("utilidad_publico", 35);
  /** Precio público sin IVA de un ítem del inventario. */
  const precio = (i: { costo: Prisma.Decimal | number; pvp: Prisma.Decimal | number }) =>
    Number(i.costo) > 0 ? precioDesdeCosto(Number(i.costo), utilidad) : pvpASinIva(Number(i.pvp), iva);
  return { iva, utilidad, precio };
}

/** Guarda el Excel como una nueva "foto" del inventario. Devuelve el id de la carga. */
export async function guardarCarga(db: PrismaClient, leido: InventarioLeido, archivo: string, userId: string | null) {
  const totalUnidades = leido.filas.reduce((s, f) => s + f.stock, 0);
  const totalCosto = leido.filas.reduce((s, f) => s + f.costo * f.stock, 0);
  const totalPvp = leido.filas.reduce((s, f) => s + f.pvp * f.stock, 0);
  const carga = await db.inventarioCarga.create({
    data: {
      sucursal: leido.sucursal,
      archivo: archivo.slice(0, 200),
      userId,
      totalProductos: leido.filas.length,
      totalUnidades: totalUnidades.toFixed(3),
      totalCosto: totalCosto.toFixed(4),
      totalPvp: totalPvp.toFixed(4),
    },
    select: { id: true },
  });
  await db.inventarioItem.createMany({
    data: leido.filas.map((f) => ({
      cargaId: carga.id,
      codigo: f.codigo,
      nombre: f.nombre,
      categoria: f.categoria,
      marca: f.marca,
      stock: f.stock.toFixed(3),
      costo: f.costo.toFixed(4),
      pvp: f.pvp.toFixed(4),
    })),
  });
  return carga.id;
}

/** Crea las categorías de `datos-base.ts` que falten. Devuelve slug → id. */
async function asegurarCategorias(db: PrismaClient) {
  const existentes = new Map((await db.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  for (const [orden, cat] of CATEGORIAS.entries()) {
    const slug = slugify(cat.nombre);
    let padreId = existentes.get(slug);
    if (!padreId) {
      padreId = (await db.category.create({ data: { nombre: cat.nombre, slug, icono: cat.icono, orden }, select: { id: true } })).id;
      existentes.set(slug, padreId);
    }
    for (const [subOrden, sub] of cat.subs.entries()) {
      const subSlug = `${slug}-${slugify(sub)}`;
      if (!existentes.has(subSlug)) {
        const nueva = await db.category.create({ data: { nombre: sub, slug: subSlug, orden: subOrden, parentId: padreId }, select: { id: true } });
        existentes.set(subSlug, nueva.id);
      }
    }
  }
  return existentes;
}

/** Crea las marcas que falten. Devuelve nombre → id. */
async function asegurarMarcas(db: PrismaClient, nombres: string[]) {
  const porSlug = new Map((await db.brand.findMany({ select: { id: true, slug: true } })).map((b) => [b.slug, b.id]));
  const faltan = [...new Set(nombres)].filter((n) => !porSlug.has(slugify(n)));
  if (faltan.length) {
    await db.brand.createMany({ data: faltan.map((nombre) => ({ nombre, slug: slugify(nombre) })), skipDuplicates: true });
    for (const b of await db.brand.findMany({ where: { slug: { in: faltan.map(slugify) } }, select: { id: true, slug: true } })) porSlug.set(b.slug, b.id);
  }
  return (nombre: string) => porSlug.get(slugify(nombre)) ?? null;
}

export type VistaPrevia = {
  crear: number; // productos nuevos en la tienda
  actualizar: number; // existentes con stock o precio distinto
  ocultar: number; // publicados en la tienda que no están en el Excel
  reactivar: number; // ocultos antes por inventario que vuelven a aparecer
};

/** Qué pasaría en la tienda si se aplica esta carga (sin cambiar nada). */
export async function vistaPrevia(db: PrismaClient, cargaId: string): Promise<VistaPrevia> {
  const [items, productos, { precio }] = await Promise.all([
    db.inventarioItem.findMany({ where: { cargaId }, select: { codigo: true, stock: true, costo: true, pvp: true } }),
    db.product.findMany({ select: { codigo: true, stock: true, precioSinIva: true, estado: true, motivoRechazo: true } }),
    leerPrecios(db),
  ]);
  const porCodigo = new Map(productos.map((p) => [p.codigo, p]));
  const enExcel = new Set(items.map((i) => i.codigo));
  const r: VistaPrevia = { crear: 0, actualizar: 0, ocultar: 0, reactivar: 0 };
  for (const i of items) {
    const p = porCodigo.get(i.codigo);
    if (!p) r.crear++;
    else {
      if (p.estado === "BORRADOR" && p.motivoRechazo === MOTIVO_OCULTO) r.reactivar++;
      if (p.stock !== stockTienda(Number(i.stock)) || Number(p.precioSinIva) !== precio(i)) r.actualizar++;
    }
  }
  for (const p of productos) if (!enExcel.has(p.codigo) && !(p.estado === "BORRADOR" && p.motivoRechazo === MOTIVO_OCULTO)) r.ocultar++;
  return r;
}

/** Aplica la carga a la tienda (ver reglas arriba). Devuelve el resumen de lo que cambió. */
export async function aplicarCarga(db: PrismaClient, cargaId: string): Promise<VistaPrevia> {
  const resumen = await vistaPrevia(db, cargaId);
  const [items, { precio }, categorias] = await Promise.all([
    db.inventarioItem.findMany({ where: { cargaId }, orderBy: { codigo: "asc" } }),
    leerPrecios(db),
    asegurarCategorias(db),
  ]);
  const existentes = new Set((await db.product.findMany({ select: { codigo: true } })).map((p) => p.codigo));

  // 1) Crear los productos nuevos.
  const nuevos = items.filter((i) => !existentes.has(i.codigo));
  const marcaDe = await asegurarMarcas(
    db,
    nuevos.map((i) => marcaProducto(i.nombre, i.marca)).filter((m): m is string => Boolean(m)),
  );
  const slugs = new Set((await db.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  const datosNuevos: Prisma.ProductCreateManyInput[] = nuevos.map((i) => {
    const nombre = nombreLegible(i.nombre);
    const u = ubicarProducto(i.nombre, i.categoria);
    const padre = slugify(u.categoria);
    const categoryId = (u.sub && categorias.get(`${padre}-${slugify(u.sub)}`)) || categorias.get(padre);
    if (!categoryId) throw new Error(`Falta la categoría "${u.categoria}" en prisma/datos-base.ts`);
    let slug = `${slugify(nombre).slice(0, 80).replace(/-$/, "")}-${slugify(i.codigo)}`;
    for (let n = 2; slugs.has(slug); n++) slug = `${slug}-${n}`;
    slugs.add(slug);
    const marca = marcaProducto(i.nombre, i.marca);
    const precioSinIva = precio(i);
    return {
      codigo: i.codigo,
      nombre: nombre.slice(0, 200),
      slug,
      precioSinIva,
      stock: stockTienda(Number(i.stock)),
      // Sin precio no se puede vender: queda en borrador para completarlo en el panel.
      estado: precioSinIva > 0 ? "PUBLICADO" : "BORRADOR",
      categoryId,
      brandId: marca ? marcaDe(marca) : null,
    };
  });
  for (let k = 0; k < datosNuevos.length; k += 500) await db.product.createMany({ data: datosNuevos.slice(k, k + 500) });

  // 2) Actualizar stock y precio de los que ya existían (una sola consulta por bloque).
  const existentesExcel = items.filter((i) => existentes.has(i.codigo));
  for (let k = 0; k < existentesExcel.length; k += 500) {
    const filas = existentesExcel
      .slice(k, k + 500)
      .map((i) => Prisma.sql`(${i.codigo}, ${stockTienda(Number(i.stock))}::int, ${precio(i)}::numeric)`);
    await db.$executeRaw`
      UPDATE "Product" AS p SET
        "stock" = v.stock,
        "precioSinIva" = v.precio,
        "estado" = CASE WHEN p."estado" = 'BORRADOR' AND p."motivoRechazo" = ${MOTIVO_OCULTO} THEN 'PUBLICADO'::"EstadoProducto" ELSE p."estado" END,
        "motivoRechazo" = CASE WHEN p."motivoRechazo" = ${MOTIVO_OCULTO} THEN NULL ELSE p."motivoRechazo" END,
        "updatedAt" = now()
      FROM (VALUES ${Prisma.join(filas)}) AS v(codigo, stock, precio)
      WHERE p."codigo" = v.codigo`;
  }

  // 3) Ocultar lo que ya no está en el inventario.
  const codigos = items.map((i) => i.codigo);
  await db.$executeRaw`
    UPDATE "Product" SET "stock" = 0, "estado" = 'BORRADOR'::"EstadoProducto", "motivoRechazo" = ${MOTIVO_OCULTO},
      "destacado" = false, "updatedAt" = now()
    WHERE NOT ("codigo" = ANY(${codigos}::text[]))
      AND NOT ("estado" = 'BORRADOR' AND "motivoRechazo" IS NOT DISTINCT FROM ${MOTIVO_OCULTO})`;

  // 4) Mostrar solo las categorías con productos publicados (y sus categorías padre).
  const usadas = await db.product.findMany({ where: { estado: "PUBLICADO" }, distinct: ["categoryId"], select: { category: { select: { id: true, parentId: true } } } });
  const visibles = new Set(usadas.flatMap((u) => [u.category.id, u.category.parentId]).filter((id): id is string => Boolean(id)));
  await db.category.updateMany({ where: { id: { in: [...visibles] } }, data: { activa: true } });
  await db.category.updateMany({ where: { id: { notIn: [...visibles] } }, data: { activa: false } });

  // 5) Si no hay destacados, se destacan los 8 publicados de mayor precio con stock (luego se cambian en el panel).
  if ((await db.product.count({ where: { destacado: true, estado: "PUBLICADO" } })) === 0) {
    const top = await db.product.findMany({
      where: { estado: "PUBLICADO", stock: { gt: 0 } },
      orderBy: { precioSinIva: "desc" },
      take: 8,
      select: { id: true },
    });
    await db.product.updateMany({ where: { id: { in: top.map((t) => t.id) } }, data: { destacado: true } });
  }

  await db.inventarioCarga.update({ where: { id: cargaId }, data: { aplicadaEn: new Date() } });
  return resumen;
}

/**
 * Recalcula el precio de los productos con el costo de la última carga APLICADA
 * (se usa al cambiar la utilidad en Admin → Configuración). Devuelve cuántos cambiaron.
 */
export async function recalcularPrecios(db: PrismaClient): Promise<number> {
  const carga = await db.inventarioCarga.findFirst({ where: { aplicadaEn: { not: null } }, orderBy: { aplicadaEn: "desc" }, select: { id: true } });
  if (!carga) return 0;
  const [items, { precio }] = await Promise.all([
    db.inventarioItem.findMany({ where: { cargaId: carga.id }, select: { codigo: true, costo: true, pvp: true } }),
    leerPrecios(db),
  ]);
  let cambiados = 0;
  for (let k = 0; k < items.length; k += 500) {
    const filas = items.slice(k, k + 500).map((i) => Prisma.sql`(${i.codigo}, ${precio(i)}::numeric)`);
    cambiados += await db.$executeRaw`
      UPDATE "Product" AS p SET "precioSinIva" = v.precio, "updatedAt" = now()
      FROM (VALUES ${Prisma.join(filas)}) AS v(codigo, precio)
      WHERE p."codigo" = v.codigo AND p."precioSinIva" <> v.precio`;
  }
  return cambiados;
}
