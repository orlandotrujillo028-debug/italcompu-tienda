"use server";

import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma, type EstadoProducto } from "@prisma/client";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { productoSchema } from "@/lib/validaciones/producto";

type Resultado = { ok: true; id: string; estado: EstadoProducto } | { error: string };

/**
 * Crea o edita un producto (personal y admin).
 * - "borrador": se guarda sin enviar a revisión.
 * - "enviar": el ADMIN publica directo; el personal lo deja PENDIENTE de aprobación,
 *   salvo que en un producto ya publicado solo haya cambiado el stock.
 */
export async function guardarProducto(id: unknown, datos: unknown, accion: unknown): Promise<Resultado> {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const v = productoSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos del producto." };
  const modo = z.enum(["borrador", "enviar"]).catch("enviar").parse(accion);
  const productoId = typeof id === "string" && id ? id : null;
  const d = v.data;

  // La categoría debe ser una SUBcategoría activa; la marca, si viene, debe existir.
  const [categoria, marca] = await Promise.all([
    prisma.category.findFirst({ where: { id: d.categoryId, activa: true, NOT: { parentId: null } }, select: { id: true } }),
    d.brandId ? prisma.brand.findUnique({ where: { id: d.brandId }, select: { id: true } }) : null,
  ]);
  if (!categoria) return { error: "Elige una subcategoría válida." };
  if (d.brandId && !marca) return { error: "La marca no existe." };

  const anterior = productoId
    ? await prisma.product.findUnique({
        where: { id: productoId },
        select: { estado: true, codigo: true, nombre: true, categoryId: true, brandId: true, precioSinIva: true, garantiaMeses: true, descripcion: true, specs: true, slug: true, images: { orderBy: { orden: "asc" }, select: { url: true } } },
      })
    : null;
  if (productoId && !anterior) return { error: "El producto no existe." };

  const soloCambioStock =
    !!anterior &&
    anterior.codigo === d.codigo &&
    anterior.nombre === d.nombre &&
    anterior.categoryId === d.categoryId &&
    (anterior.brandId ?? "") === (d.brandId ?? "") &&
    Number(anterior.precioSinIva) === d.precioSinIva &&
    anterior.garantiaMeses === d.garantiaMeses &&
    (anterior.descripcion ?? "") === (d.descripcion ?? "") &&
    JSON.stringify(anterior.specs ?? []) === JSON.stringify(d.specs) &&
    JSON.stringify(anterior.images.map((i) => i.url)) === JSON.stringify(d.imagenes);

  let estado: EstadoProducto;
  if (modo === "borrador") estado = "BORRADOR";
  else if (usuario.rol === "ADMIN") estado = "PUBLICADO";
  else if (anterior?.estado === "PUBLICADO" && soloCambioStock) estado = "PUBLICADO";
  else estado = "PENDIENTE";

  const campos = {
    codigo: d.codigo,
    nombre: d.nombre,
    slug: `${slugify(d.nombre)}-${d.codigo.toLowerCase()}`,
    descripcion: d.descripcion || null,
    specs: d.specs,
    precioSinIva: d.precioSinIva,
    stock: d.stock,
    garantiaMeses: d.garantiaMeses,
    categoryId: d.categoryId,
    brandId: d.brandId || null,
    estado,
    motivoRechazo: null,
  };
  const imagenes = d.imagenes.map((url, orden) => ({ url, orden }));

  try {
    const p = await prisma.$transaction(async (tx) => {
      if (productoId) {
        await tx.productImage.deleteMany({ where: { productId: productoId } });
        return tx.product.update({ where: { id: productoId }, data: { ...campos, images: { create: imagenes } }, select: { id: true, slug: true } });
      }
      return tx.product.create({ data: { ...campos, images: { create: imagenes } }, select: { id: true, slug: true } });
    });

    await registrarActividad(usuario.id, productoId ? "producto.editado" : "producto.creado", `${d.codigo} · ${d.nombre} → ${estado}`);
    revalidateTag("productos");
    revalidatePath(`/producto/${p.slug}`);
    if (anterior && anterior.slug !== p.slug) revalidatePath(`/producto/${anterior.slug}`);
    revalidatePath("/vendedor", "layout");
    return { ok: true, id: p.id, estado };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `Ya existe un producto con el código ${d.codigo} (o con el mismo nombre y código).` };
    }
    console.error("guardarProducto", e);
    return { error: "No se pudo guardar el producto. Intenta de nuevo." };
  }
}

/**
 * Firma para subir imágenes DIRECTO a Cloudinary desde el navegador.
 * El secreto nunca sale del servidor: solo enviamos la firma (válida 1 hora).
 */
export async function firmarSubidaImagen(): Promise<
  { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string } | { error: string }
> {
  await requireRole("VENDEDOR", "ADMIN");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secreto = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secreto) {
    return { error: "Cloudinary no está configurado. Completa CLOUDINARY_* en el archivo .env (mientras tanto puedes pegar el enlace de la imagen)." };
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "italcompu/productos";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secreto}`).digest("hex");
  return { cloudName, apiKey, timestamp, folder, signature };
}
