"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

type R = { ok: true } | { error: string };
const id = z.string().min(1).max(40);

function refrescar(slug?: string) {
  revalidateTag("productos");
  if (slug) revalidatePath(`/producto/${slug}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/vendedor", "layout");
}

export async function aprobarProducto(productId: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = id.safeParse(productId);
  if (!v.success) return { error: "Producto no válido." };
  const p = await prisma.product.findUnique({ where: { id: v.data }, select: { codigo: true, nombre: true, slug: true, estado: true, images: { take: 1, select: { id: true } } } });
  if (!p) return { error: "El producto no existe." };
  if (p.estado !== "PENDIENTE") return { error: "Este producto ya no está pendiente." };
  if (!p.images.length) return { error: "Agrega al menos una imagen antes de aprobarlo." };

  await prisma.product.update({ where: { id: v.data }, data: { estado: "PUBLICADO", motivoRechazo: null } });
  await registrarActividad(admin.id, "producto.aprobado", `${p.codigo} · ${p.nombre}`);
  refrescar(p.slug);
  return { ok: true };
}

export async function rechazarProducto(productId: unknown, motivo: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.object({ id, motivo: z.string().trim().min(5, "Explica el motivo (mínimo 5 caracteres).").max(300) }).safeParse({ id: productId, motivo });
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Datos no válidos." };
  const p = await prisma.product.findUnique({ where: { id: v.data.id }, select: { codigo: true, nombre: true, slug: true, estado: true } });
  if (!p) return { error: "El producto no existe." };
  if (p.estado !== "PENDIENTE") return { error: "Este producto ya no está pendiente." };

  await prisma.product.update({ where: { id: v.data.id }, data: { estado: "RECHAZADO", motivoRechazo: v.data.motivo } });
  await registrarActividad(admin.id, "producto.rechazado", `${p.codigo} · ${p.nombre}: ${v.data.motivo}`);
  refrescar(p.slug);
  return { ok: true };
}

/** Marca o desmarca "destacado" / "nuevo" (se ve en la home y en las tarjetas). */
export async function alternarEtiqueta(productId: unknown, campo: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.object({ id, campo: z.enum(["destacado", "nuevo"]) }).safeParse({ id: productId, campo });
  if (!v.success) return { error: "Datos no válidos." };
  const p = await prisma.product.findUnique({ where: { id: v.data.id }, select: { codigo: true, slug: true, destacado: true, nuevo: true } });
  if (!p) return { error: "El producto no existe." };

  const valor = !p[v.data.campo];
  await prisma.product.update({ where: { id: v.data.id }, data: { [v.data.campo]: valor } });
  await registrarActividad(admin.id, `producto.${v.data.campo}`, `${p.codigo}: ${valor ? "sí" : "no"}`);
  refrescar(p.slug);
  return { ok: true };
}

/** Saca un producto publicado de la tienda (vuelve a borrador). */
export async function despublicarProducto(productId: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = id.safeParse(productId);
  if (!v.success) return { error: "Producto no válido." };
  const p = await prisma.product.findUnique({ where: { id: v.data }, select: { codigo: true, slug: true, estado: true } });
  if (!p || p.estado !== "PUBLICADO") return { error: "El producto no está publicado." };
  await prisma.product.update({ where: { id: v.data }, data: { estado: "BORRADOR" } });
  await registrarActividad(admin.id, "producto.despublicado", p.codigo);
  refrescar(p.slug);
  return { ok: true };
}
