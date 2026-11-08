"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { signIn, signOut } from "@/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { destinoTrasLogin } from "@/lib/roles";
import {
  datosNegocioSchema,
  loginSchema,
  recuperarSchema,
  registroClienteSchema,
  registroDistribuidorSchema,
} from "@/lib/validaciones/auth";

export type ResultadoAccion = { error?: string; ok?: string };

const ERROR_GENERICO = "No pudimos completar la solicitud. Intenta de nuevo.";

/** Inicia sesión y devuelve el rol (o null si las credenciales no sirven). */
async function entrar(email: string, password: string) {
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return null;
    throw e;
  }
  const u = await prisma.user.findUnique({ where: { email }, select: { rol: true } });
  return u?.rol ?? null;
}

// ---------- Iniciar sesión ----------
export async function iniciarSesion(datos: unknown, callbackUrl?: string | null): Promise<ResultadoAccion> {
  const v = loginSchema.safeParse(datos);
  if (!v.success) return { error: "Revisa el correo y la contraseña." };

  const rol = await entrar(v.data.email, v.data.password);
  if (!rol) return { error: "Correo o contraseña incorrectos." };

  redirect(destinoTrasLogin(rol, callbackUrl));
}

// ---------- Registro de CLIENTE ----------
export async function registrarCliente(datos: unknown, callbackUrl?: string | null): Promise<ResultadoAccion> {
  const v = registroClienteSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  const { nombre, email, telefono, password } = v.data;

  try {
    await prisma.user.create({
      data: {
        name: nombre,
        email,
        telefono: telefono || null,
        password: await bcrypt.hash(password, 12),
        rol: "CLIENTE",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?" };
    }
    console.error("registrarCliente", e);
    return { error: ERROR_GENERICO };
  }

  const rol = await entrar(email, password);
  redirect(rol ? destinoTrasLogin(rol, callbackUrl) : "/login");
}

// ---------- DISTRIBUIDORES (locales del mismo giro: precios especiales tras aprobación) ----------
type DatosNegocio = z.output<typeof datosNegocioSchema>;

const perfilDistribuidor = (d: DatosNegocio) => ({
  nombreLocal: d.nombreLocal,
  razonSocial: d.razonSocial,
  ruc: d.ruc,
  tipoNegocio: d.tipoNegocio,
  provincia: d.provincia,
  ciudad: d.ciudad,
  direccion: d.direccion || null,
  telefono: d.telefonoLocal,
  estado: "PENDIENTE" as const,
  motivoRechazo: null,
  aprobadoEn: null,
});

function errorDuplicado(e: unknown) {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;
  const campos = String((e.meta as { target?: unknown })?.target ?? "");
  return campos.includes("ruc")
    ? "Ese RUC ya tiene una solicitud de distribuidor. Si es tuyo, escríbenos."
    : "Ya existe una cuenta con ese correo. Inicia sesión y solicita ser distribuidor desde \"Mi cuenta\".";
}

/** Registro nuevo: crea la cuenta (CLIENTE) + la solicitud PENDIENTE. */
export async function registrarDistribuidor(datos: unknown): Promise<ResultadoAccion> {
  const v = registroDistribuidorSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  const { nombre, email, password } = v.data;

  try {
    await prisma.user.create({
      data: {
        name: nombre,
        email,
        telefono: v.data.telefonoLocal,
        cedula: v.data.ruc,
        password: await bcrypt.hash(password, 12),
        rol: "CLIENTE",
        distribuidor: { create: perfilDistribuidor(v.data) },
      },
    });
  } catch (e) {
    const duplicado = errorDuplicado(e);
    if (duplicado) return { error: duplicado };
    console.error("registrarDistribuidor", e);
    return { error: ERROR_GENERICO };
  }

  const rol = await entrar(email, password);
  redirect(rol ? "/cuenta" : "/login");
}

/** Un cliente que ya tiene cuenta solicita ser distribuidor (o vuelve a solicitar si lo rechazaron). */
export async function solicitarDistribuidor(datos: unknown): Promise<ResultadoAccion> {
  const usuario = await requireRole("CLIENTE");
  const v = datosNegocioSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };

  const actual = usuario.distribuidor?.estado;
  if (actual === "PENDIENTE") return { error: "Ya tienes una solicitud en revisión." };
  if (actual === "APROBADO") return { error: "Ya eres distribuidor." };
  if (actual === "SUSPENDIDO") return { error: "Tu cuenta de distribuidor está suspendida. Escríbenos." };

  try {
    await prisma.distributorProfile.upsert({
      where: { userId: usuario.id },
      create: { userId: usuario.id, ...perfilDistribuidor(v.data) },
      update: perfilDistribuidor(v.data), // solo llega aquí si estaba RECHAZADO
    });
  } catch (e) {
    const duplicado = errorDuplicado(e);
    if (duplicado) return { error: duplicado };
    console.error("solicitarDistribuidor", e);
    return { error: ERROR_GENERICO };
  }

  revalidatePath("/cuenta");
  redirect("/cuenta");
}

// ---------- Recuperar contraseña (preparado) ----------
export async function solicitarRecuperacion(datos: unknown): Promise<ResultadoAccion> {
  const v = recuperarSchema.safeParse(datos);
  if (!v.success) return { error: "Correo no válido." };

  // TODO Paso 12: generar un token (VerificationToken), guardarlo con vencimiento
  // de 1 hora y enviar el enlace por email con Resend.
  // Siempre respondemos lo mismo para no revelar qué correos están registrados.
  return {
    ok: "Si el correo está registrado, te enviaremos un enlace para crear una nueva contraseña.",
  };
}

// ---------- Cerrar sesión ----------
export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
