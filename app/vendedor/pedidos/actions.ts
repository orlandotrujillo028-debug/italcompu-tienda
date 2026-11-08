"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { siguientesEstados } from "@/lib/flujo-pedido";
import { ESTADOS_PEDIDO } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";

const entrada = z.object({
  numero: z.number().int().positive(),
  estado: z.enum(["PREPARANDO", "ENVIADO", "ENTREGADO"]),
  guia: z.string().trim().max(40).regex(/^[A-Za-z0-9-]*$/, "La guía solo lleva letras, números y guiones").optional(),
});

/** El personal avanza un pedido: preparar, enviar (con guía) o marcar entregado. */
export async function cambiarEstadoPedido(datos: unknown): Promise<{ ok: true } | { error: string }> {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const v = entrada.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Datos no válidos." };
  const { numero, estado } = v.data;
  const guia = estado === "ENVIADO" ? v.data.guia : undefined; // la guía solo se registra al enviar

  const pedido = await prisma.order.findUnique({ where: { numero }, select: { id: true, estado: true, metodoPago: true, direccionEnvio: true, guiaEnvio: true } });
  if (!pedido) return { error: "El pedido no existe." };

  if (!siguientesEstados(pedido).includes(estado)) {
    return { error: `No se puede pasar de "${ESTADOS_PEDIDO[pedido.estado].texto}" a "${ESTADOS_PEDIDO[estado].texto}".` };
  }
  if (estado === "ENVIADO" && !guia && !pedido.guiaEnvio) return { error: "Ingresa el número de guía para marcarlo como enviado." };

  // updateMany con el estado anterior: si otra persona lo cambió al mismo tiempo, no se pisa.
  const r = await prisma.order.updateMany({
    where: { id: pedido.id, estado: pedido.estado },
    data: { estado, ...(guia ? { guiaEnvio: guia } : {}) },
  });
  if (r.count === 0) return { error: "Otra persona actualizó este pedido. Recarga la página." };

  await registrarActividad(usuario.id, "pedido.estado", `#${numero}: ${pedido.estado} → ${estado}${guia ? ` (guía ${guia})` : ""}`);
  // TODO Paso 12: enviar email al cliente ("tu pedido fue enviado", etc.).
  revalidatePath("/vendedor", "layout");
  revalidatePath(`/cuenta/pedidos/${numero}`);
  return { ok: true };
}

/** Solo actualizar/corregir la guía de un pedido ya enviado. */
export async function actualizarGuia(numero: unknown, guia: unknown): Promise<{ ok: true } | { error: string }> {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const v = z.object({ numero: z.number().int().positive(), guia: z.string().trim().min(3, "Guía muy corta").max(40).regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones") }).safeParse({ numero, guia });
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Guía no válida." };

  const r = await prisma.order.updateMany({ where: { numero: v.data.numero, estado: { in: ["PREPARANDO", "ENVIADO"] } }, data: { guiaEnvio: v.data.guia } });
  if (r.count === 0) return { error: "Solo se puede cambiar la guía de pedidos en preparación o enviados." };
  await registrarActividad(usuario.id, "pedido.guia", `#${v.data.numero}: guía ${v.data.guia}`);
  revalidatePath("/vendedor", "layout");
  revalidatePath(`/cuenta/pedidos/${v.data.numero}`);
  return { ok: true };
}
