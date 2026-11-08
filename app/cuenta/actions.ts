"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUsuarioActual } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cambiarClaveSchema, datosPersonalesSchema } from "@/lib/validaciones/cuenta";
import { direccionSchema } from "@/lib/validaciones/pedido";

type Resultado = { ok: true; mensaje?: string } | { error: string };

const SESION_EXPIRADA = { error: "Tu sesión expiró. Vuelve a iniciar sesión." } as const;
const idSchema = z.string().min(1).max(40);

// Todas las acciones filtran por el usuario con sesión: nadie puede tocar datos de otra persona.

// ---------- Direcciones ----------

export async function actualizarDireccion(id: unknown, datos: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return SESION_EXPIRADA;
  const vid = idSchema.safeParse(id);
  const v = direccionSchema.safeParse(datos);
  if (!vid.success || !v.success) return { error: v.error?.issues[0]?.message ?? "Revisa la dirección." };

  const existe = await prisma.address.findFirst({ where: { id: vid.data, userId: usuario.id }, select: { id: true } });
  if (!existe) return { error: "Esa dirección no existe." };

  await prisma.$transaction(async (tx) => {
    if (v.data.principal) await tx.address.updateMany({ where: { userId: usuario.id }, data: { principal: false } });
    await tx.address.update({
      where: { id: vid.data },
      data: { ...v.data, referencia: v.data.referencia || null, principal: v.data.principal ? true : undefined },
    });
  });
  revalidatePath("/cuenta/direcciones");
  return { ok: true };
}

export async function marcarPrincipal(id: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return SESION_EXPIRADA;
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Dirección no válida." };

  const r = await prisma.$transaction(async (tx) => {
    const existe = await tx.address.findFirst({ where: { id: vid.data, userId: usuario.id }, select: { id: true } });
    if (!existe) return false;
    await tx.address.updateMany({ where: { userId: usuario.id }, data: { principal: false } });
    await tx.address.update({ where: { id: vid.data }, data: { principal: true } });
    return true;
  });
  if (!r) return { error: "Esa dirección no existe." };
  revalidatePath("/cuenta/direcciones");
  return { ok: true };
}

export async function eliminarDireccion(id: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return SESION_EXPIRADA;
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Dirección no válida." };

  const borrada = await prisma.$transaction(async (tx) => {
    const dir = await tx.address.findFirst({ where: { id: vid.data, userId: usuario.id }, select: { id: true, principal: true } });
    if (!dir) return false;
    await tx.address.delete({ where: { id: dir.id } });
    // Si era la principal, la siguiente pasa a serlo.
    if (dir.principal) {
      const otra = await tx.address.findFirst({ where: { userId: usuario.id }, orderBy: { id: "desc" }, select: { id: true } });
      if (otra) await tx.address.update({ where: { id: otra.id }, data: { principal: true } });
    }
    return true;
  });
  if (!borrada) return { error: "Esa dirección no existe." };
  // Los pedidos anteriores no se afectan: guardan su propia copia de la dirección.
  revalidatePath("/cuenta/direcciones");
  return { ok: true };
}

// ---------- Datos personales ----------

export async function actualizarDatos(datos: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return SESION_EXPIRADA;
  const v = datosPersonalesSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa tus datos." };

  await prisma.user.update({
    where: { id: usuario.id },
    data: { name: v.data.nombre, telefono: v.data.telefono || null, cedula: v.data.cedula || null },
  });
  revalidatePath("/cuenta", "layout");
  return { ok: true, mensaje: "Datos actualizados." };
}

export async function cambiarContrasena(datos: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return SESION_EXPIRADA;
  const v = cambiarClaveSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa las contraseñas." };

  const fila = await prisma.user.findUnique({ where: { id: usuario.id }, select: { password: true } });
  if (!fila?.password || !(await bcrypt.compare(v.data.actual, fila.password))) {
    return { error: "La contraseña actual no es correcta." };
  }
  await prisma.user.update({ where: { id: usuario.id }, data: { password: await bcrypt.hash(v.data.nueva, 12) } });
  return { ok: true, mensaje: "Contraseña actualizada." };
}
