"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

type R = { ok: true } | { error: string };
const id = z.string().min(1).max(40);

/** Cambia el rol de un usuario. Protege que siempre quede al menos un ADMIN activo. */
export async function cambiarRol(userId: unknown, rol: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.object({ id, rol: z.enum(["ADMIN", "VENDEDOR", "CLIENTE"]) }).safeParse({ id: userId, rol });
  if (!v.success) return { error: "Datos no válidos." };
  if (v.data.id === admin.id) return { error: "No puedes cambiar tu propio rol." };

  const u = await prisma.user.findUnique({ where: { id: v.data.id }, select: { email: true, rol: true } });
  if (!u) return { error: "El usuario no existe." };
  if (u.rol === v.data.rol) return { ok: true };

  await prisma.user.update({ where: { id: v.data.id }, data: { rol: v.data.rol } });
  await registrarActividad(admin.id, "usuario.rol", `${u.email}: ${u.rol} → ${v.data.rol}`);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Activa o desactiva una cuenta (desactivada = no puede entrar; sus pedidos se conservan). */
export async function alternarActivo(userId: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = id.safeParse(userId);
  if (!v.success) return { error: "Usuario no válido." };
  if (v.data === admin.id) return { error: "No puedes desactivar tu propia cuenta." };

  const u = await prisma.user.findUnique({ where: { id: v.data }, select: { email: true, activo: true } });
  if (!u) return { error: "El usuario no existe." };
  await prisma.user.update({ where: { id: v.data }, data: { activo: !u.activo } });
  await registrarActividad(admin.id, u.activo ? "usuario.desactivado" : "usuario.activado", u.email);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Contraseña temporal fácil de dictar por WhatsApp (sin letras que se confunden: 0/O, 1/l/I). Ej. "Ital-7KMQ-482H". */
function claveTemporal() {
  const letras = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const al = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const bloque = () => al(numeros) + al(letras) + al(letras) + al(numeros);
  return `Ital-${bloque()}-${bloque()}`;
}

/**
 * Restablece la contraseña de un usuario que la olvidó (mientras no hay correos automáticos):
 * genera una temporal, la devuelve UNA sola vez al admin para que se la pase por WhatsApp y
 * el usuario la cambia luego en Mi cuenta → Mis datos. No se guarda en ningún registro.
 */
export async function restablecerClave(userId: unknown): Promise<{ ok: true; clave: string } | { error: string }> {
  const admin = await requireRole("ADMIN");
  const v = id.safeParse(userId);
  if (!v.success) return { error: "Usuario no válido." };
  if (v.data === admin.id) return { error: "Tu propia contraseña cámbiala en Mi cuenta." };
  const u = await prisma.user.findUnique({ where: { id: v.data }, select: { email: true } });
  if (!u) return { error: "El usuario no existe." };

  const clave = claveTemporal();
  await prisma.user.update({ where: { id: v.data }, data: { password: await bcrypt.hash(clave, 12) } });
  // También se libera el bloqueo por intentos fallidos de ese correo.
  await prisma.limiteIntento.deleteMany({ where: { clave: `login:email:${u.email.toLowerCase()}` } });
  await registrarActividad(admin.id, "usuario.clave", u.email);
  return { ok: true, clave };
}

const personalSchema = z.object({
  nombre: z.string().trim().min(3, "Nombre muy corto").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Correo no válido")),
  password: z
    .string()
    .min(8, "Contraseña: mínimo 8 caracteres")
    .max(72)
    .regex(/[A-Za-z]/, "La contraseña debe tener letras")
    .regex(/\d/, "La contraseña debe tener números"),
});

/** Crea una cuenta del personal de ventas (rol VENDEDOR). No hay registro público para el personal. */
export async function crearPersonal(datos: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = personalSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  try {
    await prisma.user.create({
      data: { name: v.data.nombre, email: v.data.email, password: await bcrypt.hash(v.data.password, 12), rol: "VENDEDOR" },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Ya existe una cuenta con ese correo." };
    throw e;
  }
  await registrarActividad(admin.id, "usuario.personal_creado", v.data.email);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
