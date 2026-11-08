"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EstadoDistribuidor } from "@prisma/client";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

type R = { ok: true } | { error: string };

// Qué cambios están permitidos según el estado actual de la solicitud.
const PERMITIDO: Record<EstadoDistribuidor, EstadoDistribuidor[]> = {
  PENDIENTE: ["APROBADO", "RECHAZADO"],
  APROBADO: ["SUSPENDIDO"],
  SUSPENDIDO: ["APROBADO"],
  RECHAZADO: ["APROBADO"],
};

async function cambiar(perfilId: unknown, nuevo: EstadoDistribuidor, motivo?: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z
    .object({
      id: z.string().min(1).max(40),
      motivo: nuevo === "RECHAZADO" ? z.string().trim().min(5, "Explica el motivo (mínimo 5 caracteres).").max(300) : z.any().optional(),
    })
    .safeParse({ id: perfilId, motivo });
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Datos no válidos." };

  const perfil = await prisma.distributorProfile.findUnique({ where: { id: v.data.id }, select: { estado: true, nombreLocal: true, ruc: true, userId: true } });
  if (!perfil) return { error: "La solicitud no existe." };
  if (!PERMITIDO[perfil.estado].includes(nuevo)) return { error: "Ese cambio no está permitido desde el estado actual." };

  await prisma.distributorProfile.update({
    where: { id: v.data.id },
    data: {
      estado: nuevo,
      motivoRechazo: nuevo === "RECHAZADO" ? (v.data.motivo as string) : null,
      aprobadoEn: nuevo === "APROBADO" ? new Date() : undefined,
    },
  });
  await registrarActividad(admin.id, `distribuidor.${nuevo.toLowerCase()}`, `${perfil.nombreLocal} (RUC ${perfil.ruc})${nuevo === "RECHAZADO" ? `: ${v.data.motivo}` : ""}`);
  // TODO Paso 12: avisar al cliente por email.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function aprobarDistribuidor(id: unknown) {
  return cambiar(id, "APROBADO");
}
export async function rechazarDistribuidor(id: unknown, motivo: unknown) {
  return cambiar(id, "RECHAZADO", motivo);
}
export async function suspenderDistribuidor(id: unknown) {
  return cambiar(id, "SUSPENDIDO");
}
