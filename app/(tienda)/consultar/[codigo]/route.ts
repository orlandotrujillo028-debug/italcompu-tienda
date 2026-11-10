import { NextResponse, type NextRequest } from "next/server";
import { getConfigTienda } from "@/lib/config-tienda";
import { prisma } from "@/lib/prisma";

/**
 * "Consultar disponibilidad" de un producto sin stock: abre WhatsApp de la tienda con un mensaje
 * que ya trae el nombre, el código y el enlace del producto. Las tarjetas solo enlazan aquí, así no
 * necesitan conocer el número. Sin WhatsApp configurado → página de contacto.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const codigo = decodeURIComponent((await params).codigo).slice(0, 60);
  const [producto, config] = await Promise.all([
    prisma.product.findFirst({ where: { codigo, estado: "PUBLICADO" }, select: { nombre: true, codigo: true, slug: true } }),
    getConfigTienda(),
  ]);
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
  if (!config.whatsapp) return NextResponse.redirect(new URL("/contacto", sitio));

  const texto = producto
    ? `Hola ITALCOMPU, quisiera saber la disponibilidad de: ${producto.nombre} (código ${producto.codigo}). ${sitio}/producto/${producto.slug}`
    : "Hola ITALCOMPU, quisiera saber la disponibilidad de un producto.";
  return NextResponse.redirect(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`);
}
