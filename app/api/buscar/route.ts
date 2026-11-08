import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularPrecio, getTarifa } from "@/lib/precios";

/**
 * Sugerencias del buscador del header: GET /api/buscar?q=lenovo
 * Busca productos PUBLICADOS por nombre, código o marca, y categorías por nombre.
 * El precio sale según quién pregunta (público o distribuidor), por eso no se cachea.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ productos: [], categorias: [] });

  const contiene = { contains: q, mode: "insensitive" as const };
  const [productos, categorias, tarifa] = await Promise.all([
    prisma.product.findMany({
      where: {
        estado: "PUBLICADO",
        OR: [{ nombre: contiene }, { codigo: contiene }, { brand: { nombre: contiene } }],
      },
      orderBy: [{ destacado: "desc" }, { stock: "desc" }],
      take: 6,
      select: {
        slug: true,
        nombre: true,
        codigo: true,
        precioSinIva: true,
        stock: true,
        brand: { select: { nombre: true } },
        images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.category.findMany({
      where: { activa: true, nombre: contiene },
      orderBy: { orden: "asc" },
      take: 3,
      select: { slug: true, nombre: true, parent: { select: { nombre: true } } },
    }),
    getTarifa(),
  ]);

  return NextResponse.json(
    {
      productos: productos.map((p) => ({
        slug: p.slug,
        nombre: p.nombre,
        codigo: p.codigo,
        marca: p.brand?.nombre ?? null,
        imagen: p.images[0]?.url ?? null,
        precio: calcularPrecio(p.precioSinIva, tarifa).conIva,
        agotado: p.stock <= 0,
      })),
      categorias: categorias.map((c) => ({
        slug: c.slug,
        nombre: c.parent ? `${c.parent.nombre} › ${c.nombre}` : c.nombre,
      })),
      esDistribuidor: tarifa.esDistribuidor,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
