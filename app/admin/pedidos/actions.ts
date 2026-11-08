"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

type R = { ok: true } | { error: string };
const numero = z.number().int().positive();

function refrescar(n: number) {
  revalidatePath("/vendedor", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath(`/cuenta/pedidos/${n}`);
}

/** El admin confirma que recibió el pago (transferencia u otro): PENDIENTE_PAGO → PAGADO. */
export async function confirmarPago(num: unknown, referencia: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.object({ numero, referencia: z.string().trim().min(3, "Escribe el número de comprobante").max(60) }).safeParse({ numero: num, referencia });
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Datos no válidos." };

  const r = await prisma.order.updateMany({
    where: { numero: v.data.numero, estado: "PENDIENTE_PAGO", metodoPago: { in: ["TRANSFERENCIA", "TARJETA"] } },
    data: { estado: "PAGADO", referenciaPago: v.data.referencia },
  });
  if (r.count === 0) return { error: "Este pedido ya no está pendiente de pago." };
  await registrarActividad(admin.id, "pedido.pago_confirmado", `#${v.data.numero} · comprobante ${v.data.referencia}`);
  // TODO Paso 12: email "pago confirmado" al cliente.
  refrescar(v.data.numero);
  return { ok: true };
}

/**
 * Cancela un pedido que todavía no salió (pendiente, pagado o en preparación)
 * y DEVUELVE el stock de sus productos. Todo en una transacción.
 */
export async function cancelarPedido(num: unknown, motivo: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.object({ numero, motivo: z.string().trim().min(5, "Explica el motivo (mínimo 5 caracteres).").max(300) }).safeParse({ numero: num, motivo });
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Datos no válidos." };

  const ok = await prisma.$transaction(async (tx) => {
    const p = await tx.order.findUnique({ where: { numero: v.data.numero }, select: { id: true, estado: true, notas: true, items: { select: { productId: true, cantidad: true } } } });
    if (!p || !["PENDIENTE_PAGO", "PAGADO", "PREPARANDO"].includes(p.estado)) return false;
    const r = await tx.order.updateMany({
      where: { id: p.id, estado: p.estado },
      data: { estado: "CANCELADO", notas: [p.notas, `Cancelado: ${v.data.motivo}`].filter(Boolean).join("\n") },
    });
    if (r.count === 0) return false;
    for (const i of p.items) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.cantidad } } });
    return true;
  });
  if (!ok) return { error: "Solo se cancelan pedidos que aún no fueron enviados." };

  await registrarActividad(admin.id, "pedido.cancelado", `#${v.data.numero}: ${v.data.motivo} (stock devuelto)`);
  revalidateTag("productos"); // el stock volvió
  refrescar(v.data.numero);
  return { ok: true };
}
