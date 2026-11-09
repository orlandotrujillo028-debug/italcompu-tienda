import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Se regenera cada hora (no en cada visita).
export const revalidate = 3600;

/** /sitemap.xml — todas las páginas públicas para que Google las encuentre. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, marcas, productos] = await Promise.all([
    prisma.category.findMany({ where: { activa: true, OR: [{ parentId: null }, { parent: { activa: true } }] }, select: { slug: true } }),
    prisma.brand.findMany({ where: { products: { some: { estado: "PUBLICADO" } } }, select: { slug: true } }),
    prisma.product.findMany({ where: { estado: "PUBLICADO" }, select: { slug: true, updatedAt: true } }),
  ]);

  const fijas = [
    { ruta: "", prioridad: 1, frecuencia: "daily" as const },
    { ruta: "/nuevos", prioridad: 0.8, frecuencia: "daily" as const },
    { ruta: "/marcas", prioridad: 0.6, frecuencia: "weekly" as const },
    { ruta: "/distribuidores", prioridad: 0.6, frecuencia: "monthly" as const },
    { ruta: "/quienes-somos", prioridad: 0.4, frecuencia: "yearly" as const },
    { ruta: "/servicio-tecnico", prioridad: 0.4, frecuencia: "yearly" as const },
    { ruta: "/contacto", prioridad: 0.5, frecuencia: "yearly" as const },
    { ruta: "/politicas-de-garantia", prioridad: 0.3, frecuencia: "yearly" as const },
    { ruta: "/proteccion-de-datos", prioridad: 0.2, frecuencia: "yearly" as const },
    { ruta: "/terminos", prioridad: 0.2, frecuencia: "yearly" as const },
  ];

  return [
    ...fijas.map((f) => ({ url: `${SITIO}${f.ruta}`, changeFrequency: f.frecuencia, priority: f.prioridad })),
    ...categorias.map((c) => ({ url: `${SITIO}/categoria/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...marcas.map((m) => ({ url: `${SITIO}/marca/${m.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...productos.map((p) => ({ url: `${SITIO}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
