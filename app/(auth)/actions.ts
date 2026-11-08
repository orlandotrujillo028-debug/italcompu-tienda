"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { destinoTrasLogin } from "@/lib/roles";
import { slugify } from "@/lib/slug";
import {
  loginSchema,
  recuperarSchema,
  registroClienteSchema,
  registroVendedorSchema,
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

// ---------- Registro de VENDEDOR (queda PENDIENTE de aprobación) ----------
async function slugLibre(nombreTienda: string) {
  const base = slugify(nombreTienda) || "tienda";
  let slug = base;
  for (let i = 2; await prisma.vendorProfile.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function registrarVendedor(datos: unknown): Promise<ResultadoAccion> {
  const v = registroVendedorSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  const { nombre, email, telefono, password, nombreTienda, ruc, descripcion } = v.data;

  try {
    await prisma.user.create({
      data: {
        name: nombre,
        email,
        telefono,
        cedula: ruc || null,
        password: await bcrypt.hash(password, 12),
        rol: "VENDEDOR",
        vendorProfile: {
          create: {
            nombreTienda,
            slug: await slugLibre(nombreTienda),
            ruc: ruc || null,
            telefono,
            descripcion: descripcion || null,
            estado: "PENDIENTE",
          },
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Ya existe una cuenta con ese correo o nombre de tienda." };
    }
    console.error("registrarVendedor", e);
    return { error: ERROR_GENERICO };
  }

  const rol = await entrar(email, password);
  redirect(rol ? "/vendedor" : "/login");
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
