"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { getUsuarioActual } from "@/lib/auth-guards";
import { getConfigTienda } from "@/lib/config-tienda";
import { cotizar, type Aviso } from "@/lib/pedido";
import { getTarifa } from "@/lib/precios";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, direccionSchema } from "@/lib/validaciones/pedido";
import { enlaceWhatsappPedido } from "@/lib/whatsapp-pedido";

// ---------- Direcciones ----------

export async function guardarDireccion(datos: unknown): Promise<{ id: string } | { error: string }> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  const v = direccionSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa la dirección." };

  const cuantas = await prisma.address.count({ where: { userId: usuario.id } });
  if (cuantas >= 10) return { error: "Puedes guardar hasta 10 direcciones." };
  const principal = cuantas === 0 || !!v.data.principal;

  const dir = await prisma.$transaction(async (tx) => {
    if (principal) await tx.address.updateMany({ where: { userId: usuario.id }, data: { principal: false } });
    return tx.address.create({
      data: { ...v.data, referencia: v.data.referencia || null, principal, userId: usuario.id },
      select: { id: true },
    });
  });
  revalidatePath("/checkout");
  return { id: dir.id };
}

// ---------- Crear pedido ----------

/** numero: pedido creado · whatsapp: enlace wa.me con el pedido (null si la tienda no tiene WhatsApp). */
type Resultado = { numero: number; whatsapp: string | null } | { error: string; avisos?: Aviso[] };

class SinStock extends Error {}

/**
 * Crea el pedido. Nunca confía en el navegador:
 * - recalcula precios con la tarifa del usuario (público o distribuidor),
 * - revisa el stock y lo descuenta en UNA transacción (si algo falla, no se guarda nada),
 * - copia la dirección y los precios al pedido (si luego cambian, el pedido queda igual).
 */
export async function crearPedido(datos: unknown): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const v = checkoutSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos del pedido." };
  const { items, metodoEnvio, direccionId, metodoPago, notas } = v.data;

  const tarifa = await getTarifa();
  const c = await cotizar(items, tarifa, metodoEnvio);
  if (c.lineas.length === 0) return { error: "Tu carrito está vacío." };
  if (c.avisos.length) return { error: "Algunos productos cambiaron de disponibilidad. Revisa tu pedido antes de confirmar.", avisos: c.avisos };

  let direccionEnvio: Prisma.InputJsonValue;
  if (metodoEnvio === "DOMICILIO") {
    const d = await prisma.address.findFirst({ where: { id: direccionId, userId: usuario.id } });
    if (!d) return { error: "Elige una dirección de entrega válida." };
    direccionEnvio = {
      tipo: "DOMICILIO",
      nombre: d.nombre,
      telefono: d.telefono,
      provincia: d.provincia,
      ciudad: d.ciudad,
      direccion: d.direccion,
      referencia: d.referencia,
    };
  } else {
    const tienda = await getConfigTienda();
    direccionEnvio = { tipo: "RETIRO", nombre: usuario.name ?? usuario.email, direccion: tienda.direccion, horario: tienda.horario };
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      for (const l of c.lineas) {
        // Solo descuenta si todavía hay stock suficiente (evita vender lo que no hay si dos compran a la vez).
        const r = await tx.product.updateMany({
          where: { id: l.productId, estado: "PUBLICADO", stock: { gte: l.cantidad } },
          data: { stock: { decrement: l.cantidad } },
        });
        if (r.count === 0) throw new SinStock(l.nombre);
      }
      return tx.order.create({
        data: {
          userId: usuario.id,
          metodoPago,
          descuentoDistribuidor: tarifa.descuento,
          subtotal: c.subtotal,
          iva: c.iva,
          envio: c.envio,
          total: c.total,
          direccionEnvio,
          courier: metodoEnvio === "RETIRO" ? "Retiro en tienda" : "Servientrega",
          notas: notas || null,
          items: {
            create: c.lineas.map((l) => ({
              productId: l.productId,
              nombre: l.nombre,
              codigo: l.codigo,
              precioSinIva: l.unitarioSinIva,
              cantidad: l.cantidad,
            })),
          },
        },
        select: { numero: true },
      });
    });

    revalidateTag("productos"); // el stock cambió: refresca vitrinas
    // El pedido ya está guardado: armamos el mensaje con los datos reales y lo devolvemos.
    return { numero: pedido.numero, whatsapp: await enlaceWhatsappPedido(pedido.numero) };
  } catch (e) {
    if (e instanceof SinStock) return { error: `Alguien acaba de comprar las últimas unidades de “${e.message}”. Revisa tu carrito.` };
    console.error("crearPedido", e);
    return { error: "No pudimos crear tu pedido. Intenta de nuevo en unos segundos." };
  }
}
