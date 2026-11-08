"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioActual } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/**
 * SOLO DESARROLLO: marca un pedido con tarjeta como PAGADO para poder probar el resto del flujo.
 * En producción no hace nada; el pago real llega con la pasarela (Paso 12).
 */
export async function simularPagoTarjeta(numero: number): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NODE_ENV === "production") return { ok: false, error: "No disponible." };
  const usuario = await getUsuarioActual();
  if (!usuario || !Number.isInteger(numero)) return { ok: false, error: "No autorizado." };

  const r = await prisma.order.updateMany({
    where: { numero, userId: usuario.id, metodoPago: "TARJETA", estado: "PENDIENTE_PAGO" },
    data: { estado: "PAGADO", referenciaPago: `SIMULADO-${Date.now()}` },
  });
  revalidatePath(`/pedido/${numero}/confirmacion`);
  return r.count ? { ok: true } : { ok: false, error: "Este pedido no se puede pagar." };
}
