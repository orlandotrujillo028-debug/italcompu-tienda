import "server-only";
import { prisma } from "@/lib/prisma";
import { formatoPct, formatoUSD } from "@/lib/formato";
import { calcularPrecio } from "@/lib/precios-calculo";
import { METODOS_PAGO_TEXTO, type DireccionPedido } from "@/lib/pedidos-ui";

/*
 * Pedido por WhatsApp: al confirmar la compra se abre WhatsApp con el detalle del pedido
 * dirigido al número de la tienda. El texto se arma AQUÍ (servidor), con los datos ya
 * guardados del pedido, para que nadie pueda alterar precios o totales desde el navegador.
 */

/** Número que recibe los pedidos: "whatsapp_pedidos" o, si está vacío, el WhatsApp general. */
export async function numeroWhatsappPedidos(): Promise<string> {
  const filas = await prisma.setting.findMany({ where: { clave: { in: ["whatsapp_pedidos", "whatsapp"] } } });
  const v = (k: string) => (filas.find((f) => f.clave === k)?.valor ?? "").replace(/\D/g, "");
  return v("whatsapp_pedidos") || v("whatsapp");
}

const MAX_LINEAS = 20; // WhatsApp acepta mensajes largos, pero un enlace muy largo puede fallar en algunos teléfonos

/** Enlace wa.me con el pedido listo para enviar (null si la tienda no tiene WhatsApp configurado). */
export async function enlaceWhatsappPedido(numero: number): Promise<string | null> {
  const [telefono, pedido] = await Promise.all([
    numeroWhatsappPedidos(),
    prisma.order.findUnique({
      where: { numero },
      include: { items: true, user: { select: { name: true, email: true, telefono: true, cedula: true } } },
    }),
  ]);
  if (!telefono || !pedido) return null;

  const iva = Number(pedido.subtotal) > 0 ? Math.round((Number(pedido.iva) / Number(pedido.subtotal)) * 100) : 15;
  const dir = pedido.direccionEnvio as DireccionPedido;
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const productos = pedido.items.slice(0, MAX_LINEAS).map((i) => {
    const unitario = calcularPrecio(i.precioSinIva, { iva, esDistribuidor: false }).conIva;
    return `• ${i.cantidad} × ${i.nombre} (${i.codigo}) — ${formatoUSD(unitario * i.cantidad)}`;
  });
  if (pedido.items.length > MAX_LINEAS) productos.push(`• …y ${pedido.items.length - MAX_LINEAS} productos más (ver enlace)`);

  const entrega =
    dir.tipo === "RETIRO"
      ? "Retiro en tienda"
      : `Envío a domicilio: ${dir.direccion}, ${dir.ciudad}, ${dir.provincia}${dir.referencia ? ` (Ref.: ${dir.referencia})` : ""}. Recibe: ${dir.nombre}, ${dir.telefono}`;

  const lineas = [
    `Hola ITALCOMPU 👋, quiero confirmar mi *pedido #${pedido.numero}*`,
    "",
    `👤 ${pedido.user.name ?? "Cliente"} · ${pedido.user.email}${pedido.user.telefono ? ` · ${pedido.user.telefono}` : ""}${pedido.user.cedula ? ` · CI/RUC ${pedido.user.cedula}` : ""}`,
    Number(pedido.descuentoDistribuidor) > 0 ? `🏪 Cliente distribuidor (precios de distribuidor, ${formatoPct(pedido.descuentoDistribuidor)} % de ahorro)` : null,
    "",
    "🛒 *Productos*",
    ...productos,
    "",
    `Subtotal sin IVA: ${formatoUSD(pedido.subtotal)}`,
    `IVA (${iva} %): ${formatoUSD(pedido.iva)}`,
    `Envío: ${Number(pedido.envio) === 0 ? "Gratis" : formatoUSD(pedido.envio)}`,
    `*Total: ${formatoUSD(pedido.total)}*`,
    "",
    `🚚 ${entrega}`,
    `💳 Pago: ${METODOS_PAGO_TEXTO[pedido.metodoPago]}${pedido.metodoPago === "TARJETA" ? " (envíenme el link de pago, por favor)" : ""}`,
    pedido.notas ? `📝 Notas: ${pedido.notas}` : null,
    sitio ? `\nDetalle: ${sitio}/cuenta/pedidos/${pedido.numero}` : null,
  ].filter((l) => l !== null);

  return `https://wa.me/${telefono}?text=${encodeURIComponent(lineas.join("\n"))}`;
}
