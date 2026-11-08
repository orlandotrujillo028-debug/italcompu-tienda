import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth-guards";

/*
 * Consultas del catálogo público.
 * Los datos de productos se guardan en caché (no dependen del usuario);
 * el PRECIO se calcula después, en cada página, con la tarifa del usuario.
 * El admin refresca la caché con revalidateTag("productos" | "categorias" | "banners").
 */

// ---------- Categorías ----------

/** Categorías principales con sus subcategorías, para el menú y la home. */
export const getMenuCategorias = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { parentId: null, activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        slug: true,
        icono: true,
        children: {
          where: { activa: true },
          orderBy: { orden: "asc" },
          select: { id: true, nombre: true, slug: true },
        },
      },
    }),
  ["menu-categorias"],
  { revalidate: 3600, tags: ["categorias"] },
);

export type CategoriaMenu = Awaited<ReturnType<typeof getMenuCategorias>>[number];

// ---------- Productos para tarjetas ----------

const seleccionTarjeta = {
  id: true,
  slug: true,
  nombre: true,
  codigo: true,
  precioSinIva: true,
  stock: true,
  destacado: true,
  nuevo: true,
  brand: { select: { nombre: true } },
  images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

type FilaTarjeta = Prisma.ProductGetPayload<{ select: typeof seleccionTarjeta }>;

/** Lo mínimo que necesita una tarjeta de producto (precio sin IVA como número). */
export type ProductoTarjeta = {
  id: string;
  slug: string;
  nombre: string;
  codigo: string;
  precioSinIva: number;
  stock: number;
  destacado: boolean;
  nuevo: boolean;
  marca: string | null;
  imagen: string | null;
};

const aTarjeta = (p: FilaTarjeta): ProductoTarjeta => ({
  id: p.id,
  slug: p.slug,
  nombre: p.nombre,
  codigo: p.codigo,
  precioSinIva: Number(p.precioSinIva),
  stock: p.stock,
  destacado: p.destacado,
  nuevo: p.nuevo,
  marca: p.brand?.nombre ?? null,
  imagen: p.images[0]?.url ?? null,
});

const PUBLICADO = { estado: "PUBLICADO" } as const;
// Primero los que tienen stock, luego destacados, luego los más nuevos.
const ordenVitrina: Prisma.ProductOrderByWithRelationInput[] = [{ destacado: "desc" }, { createdAt: "desc" }];
const conStockPrimero = (lista: ProductoTarjeta[]) => [...lista].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));

/** Categorías que tienen su propia vitrina en la home (en este orden). */
const SECCIONES_HOME = ["laptops", "computadores", "componentes", "almacenamiento", "monitores", "impresion", "perifericos"];

/** Todo lo que muestra la home: destacados, nuevos y una vitrina por categoría. */
export const getVitrinasHome = unstable_cache(
  async () => {
    const [destacados, nuevos, categorias] = await Promise.all([
      prisma.product.findMany({ where: { ...PUBLICADO, destacado: true }, orderBy: { createdAt: "desc" }, take: 12, select: seleccionTarjeta }),
      prisma.product.findMany({ where: { ...PUBLICADO, nuevo: true }, orderBy: { createdAt: "desc" }, take: 12, select: seleccionTarjeta }),
      prisma.category.findMany({
        where: { slug: { in: SECCIONES_HOME }, activa: true },
        select: {
          id: true,
          nombre: true,
          slug: true,
          icono: true,
          children: { where: { activa: true }, orderBy: { orden: "asc" }, select: { id: true, nombre: true, slug: true } },
        },
      }),
    ]);

    const secciones = await Promise.all(
      SECCIONES_HOME.map(async (slug) => {
        const cat = categorias.find((c) => c.slug === slug);
        if (!cat) return null;
        const productos = await prisma.product.findMany({
          where: { ...PUBLICADO, OR: [{ categoryId: cat.id }, { category: { parentId: cat.id } }] },
          orderBy: ordenVitrina,
          take: 10,
          select: seleccionTarjeta,
        });
        return productos.length ? { ...cat, productos: conStockPrimero(productos.map(aTarjeta)) } : null;
      }),
    );

    return {
      destacados: conStockPrimero(destacados.map(aTarjeta)),
      nuevos: conStockPrimero(nuevos.map(aTarjeta)),
      secciones: secciones.filter((s) => s !== null),
    };
  },
  ["vitrinas-home"],
  { revalidate: 600, tags: ["productos", "categorias"] },
);

export type SeccionHome = Awaited<ReturnType<typeof getVitrinasHome>>["secciones"][number];

// ---------- Banners ----------

export const getBannersActivos = unstable_cache(
  async () =>
    prisma.banner.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { id: true, titulo: true, subtitulo: true, imagen: true, enlace: true },
    }),
  ["banners-activos"],
  { revalidate: 3600, tags: ["banners"] },
);

export type BannerHome = Awaited<ReturnType<typeof getBannersActivos>>[number];

// ---------- Lista de deseos del usuario ----------

/** Ids de productos en la lista de deseos del usuario actual (vacío si no hay sesión). */
export const getIdsDeseos = cache(async (): Promise<Set<string>> => {
  const usuario = await getUsuarioActual();
  if (!usuario) return new Set();
  const filas = await prisma.wishlistItem.findMany({ where: { userId: usuario.id }, select: { productId: true } });
  return new Set(filas.map((f) => f.productId));
});
