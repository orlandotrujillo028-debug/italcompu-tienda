import Link from "next/link";
import { Check, MapPin, Store, Truck, XCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { formatoUSD } from "@/lib/formato";
import { calcularPrecio } from "@/lib/precios-calculo";
import { ESTADOS_PEDIDO, indicePaso, PASOS_PEDIDO, type DireccionPedido, type EstadoPedido } from "@/lib/pedidos-ui";

export type PedidoConItems = Prisma.OrderGetPayload<{ include: { items: { include: { product: { select: { slug: true } } } } } }>;

export function EstadoBadge({ estado, className = "" }: { estado: EstadoPedido; className?: string }) {
  const e = ESTADOS_PEDIDO[estado];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.color} ${className}`}>{e.texto}</span>;
}

/** % de IVA con el que se cobró el pedido (se deduce de subtotal e IVA guardados). */
export function ivaDelPedido(p: { subtotal: Prisma.Decimal; iva: Prisma.Decimal }) {
  return Number(p.subtotal) > 0 ? Math.round((Number(p.iva) / Number(p.subtotal)) * 100) : 15;
}

/** Línea de tiempo del pedido: Recibido → Pagado → Preparando → Enviado → Entregado. */
export function LineaTiempo({ estado, contraEntrega }: { estado: EstadoPedido; contraEntrega: boolean }) {
  if (estado === "CANCELADO") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
        <XCircle className="size-4" /> Este pedido fue cancelado.
      </p>
    );
  }
  const actual = indicePaso(estado);
  // Contra entrega: el pago ocurre al recibir, así que ese paso no se muestra antes.
  const pasos = contraEntrega ? PASOS_PEDIDO.filter((p) => p.estado !== "PAGADO") : PASOS_PEDIDO;

  return (
    <ol className="space-y-0">
      {pasos.map((p, i) => {
        const hecho = indicePaso(p.estado) <= actual;
        const esActual = p.estado === estado;
        const ultimo = i === pasos.length - 1;
        return (
          <li key={p.estado} className="relative flex gap-3 pb-4 last:pb-0" aria-current={esActual ? "step" : undefined}>
            {/* Línea que une con el siguiente paso */}
            {!ultimo && (
              <span aria-hidden className={`absolute top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2 ${indicePaso(pasos[i + 1].estado) <= actual ? "bg-marca-azul" : "bg-border"}`} />
            )}
            <span
              className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                hecho ? "border-marca-azul bg-marca-azul text-white" : "border-border bg-white text-marca-gris"
              } ${esActual ? "ring-4 ring-marca-cyan/30" : ""}`}
            >
              {hecho ? <Check className="size-4" /> : i + 1}
            </span>
            <span className="pt-0.5">
              <span className={`block text-sm font-semibold ${hecho ? "text-marca-navy" : "text-marca-gris"}`}>{p.titulo}</span>
              {esActual && <span className="block text-xs text-marca-gris">{p.detalle}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Entrega, totales y productos de un pedido (confirmación y "Mis pedidos"). */
export function DetallePedido({ pedido }: { pedido: PedidoConItems }) {
  const dir = pedido.direccionEnvio as DireccionPedido;
  const iva = ivaDelPedido(pedido);
  const retiro = dir.tipo === "RETIRO";

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-xl border bg-card p-5 text-sm">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-marca-navy">
            {retiro ? <Store className="size-5 text-marca-azul" /> : <MapPin className="size-5 text-marca-azul" />}
            {retiro ? "Retiro en tienda" : "Entrega"}
          </h2>
          <p className="font-medium">{dir.nombre}</p>
          <p>{dir.direccion}</p>
          {retiro ? (
            dir.horario && <p className="text-marca-gris">{dir.horario}</p>
          ) : (
            <>
              <p className="text-marca-gris">
                {dir.ciudad}, {dir.provincia}
              </p>
              <p className="text-marca-gris">
                {dir.telefono}
                {dir.referencia && ` · ${dir.referencia}`}
              </p>
            </>
          )}
          {!retiro && (
            <p className="flex items-center gap-1.5 pt-2 text-marca-gris">
              <Truck className="size-4 text-marca-cyan" />
              {pedido.courier ?? "Courier"}
              {pedido.guiaEnvio ? (
                <>
                  {" · Guía "}
                  <strong className="text-foreground select-all">{pedido.guiaEnvio}</strong>
                </>
              ) : (
                " · Guía pendiente"
              )}
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 text-sm">
          <h2 className="mb-2 font-bold text-marca-navy">Totales</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1">
            <dt className="text-marca-gris">Subtotal sin IVA</dt>
            <dd className="text-right">{formatoUSD(pedido.subtotal)}</dd>
            <dt className="text-marca-gris">IVA ({iva} %)</dt>
            <dd className="text-right">{formatoUSD(pedido.iva)}</dd>
            <dt className="text-marca-gris">Envío</dt>
            <dd className="text-right">{Number(pedido.envio) === 0 ? "Gratis" : formatoUSD(pedido.envio)}</dd>
            <dt className="border-t pt-1 font-bold text-marca-navy">Total</dt>
            <dd className="border-t pt-1 text-right font-bold text-marca-azul">{formatoUSD(pedido.total)}</dd>
          </dl>
          {Number(pedido.descuentoDistribuidor) > 0 && (
            <p className="mt-2 text-xs text-emerald-700">Incluye {Number(pedido.descuentoDistribuidor)} % de descuento de distribuidor.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold text-marca-navy">Productos</h2>
        <ul className="divide-y text-sm">
          {pedido.items.map((i) => {
            // Mismo cálculo y redondeo que al cobrar (precioSinIva ya incluye el descuento si lo hubo).
            const unitario = calcularPrecio(i.precioSinIva, { iva, esDistribuidor: false, descuento: 0 }).conIva;
            return (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <Link href={`/producto/${i.product.slug}`} className="font-medium hover:text-marca-azul">
                    {i.nombre}
                  </Link>
                  <span className="block text-xs text-marca-gris">
                    Código {i.codigo} · {i.cantidad} × {formatoUSD(unitario)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{formatoUSD(unitario * i.cantidad)}</span>
              </li>
            );
          })}
        </ul>
        {pedido.notas && (
          <p className="mt-3 rounded-lg bg-marca-fondo p-3 text-sm">
            <strong>Notas:</strong> {pedido.notas}
          </p>
        )}
      </section>
    </div>
  );
}
