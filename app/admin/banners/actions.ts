"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { urlImagenPermitida } from "@/lib/validaciones/producto";

type R = { ok: true } | { error: string };

const bannerSchema = z.object({
  id: z.string().max(40).optional(),
  titulo: z.string().trim().min(3, "Título muy corto").max(80),
  subtitulo: z.string().trim().max(140).optional(),
  // Imagen: subida a Cloudinary o uno de los fondos incluidos (/banners/...).
  imagen: z.string().trim().refine((u) => /^\/banners\/[\w.-]+$/.test(u) || urlImagenPermitida(u), "La imagen debe subirse a Cloudinary"),
  // Enlace: página de la tienda (/categoria/...) o una dirección https.
  enlace: z
    .string()
    .trim()
    .max(300)
    .refine((u) => u === "" || (u.startsWith("/") && !u.startsWith("//")) || u.startsWith("https://"), "Usa una ruta de la tienda (/categoria/...) o un enlace https")
    .optional(),
  orden: z.coerce.number().int().min(0).max(99),
  activo: z.boolean(),
});

function refrescar() {
  revalidateTag("banners");
  revalidatePath("/admin/banners");
}

export async function guardarBanner(datos: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = bannerSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  const { id, ...d } = v.data;
  const data = { ...d, subtitulo: d.subtitulo || null, enlace: d.enlace || null };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  await registrarActividad(admin.id, id ? "banner.editado" : "banner.creado", d.titulo);
  refrescar();
  return { ok: true };
}

export async function eliminarBanner(id: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.string().min(1).max(40).safeParse(id);
  if (!v.success) return { error: "Banner no válido." };
  const b = await prisma.banner.findUnique({ where: { id: v.data }, select: { titulo: true } });
  if (!b) return { error: "El banner no existe." };
  await prisma.banner.delete({ where: { id: v.data } });
  await registrarActividad(admin.id, "banner.eliminado", b.titulo);
  refrescar();
  return { ok: true };
}
