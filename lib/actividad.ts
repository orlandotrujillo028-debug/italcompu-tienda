import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Registro de actividad: quién hizo qué (lo verá el admin en el Paso 11).
 * Nunca debe romper la acción principal: si falla, solo se anota en la consola.
 */
export async function registrarActividad(userId: string, accion: string, detalle?: string) {
  try {
    await prisma.activityLog.create({ data: { userId, accion, detalle: detalle?.slice(0, 500) } });
  } catch (e) {
    console.error("registrarActividad", e);
  }
}
