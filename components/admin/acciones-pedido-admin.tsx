"use client";

import { AccionConTexto } from "@/components/admin/boton-accion";
import { cancelarPedido, confirmarPago } from "@/app/admin/pedidos/actions";
import type { EstadoPedido, MetodoPago } from "@/lib/pedidos-ui";

/** Acciones que solo puede hacer el ADMIN sobre un pedido. */
export function AccionesPedidoAdmin({ numero, estado, metodoPago }: { numero: number; estado: EstadoPedido; metodoPago: MetodoPago }) {
  const puedeConfirmar = estado === "PENDIENTE_PAGO" && metodoPago !== "CONTRA_ENTREGA";
  const puedeCancelar = ["PENDIENTE_PAGO", "PAGADO", "PREPARANDO"].includes(estado);
  if (!puedeConfirmar && !puedeCancelar) return <p className="text-sm text-marca-gris">Sin acciones de administración para este estado.</p>;

  return (
    <div className="flex flex-col items-start gap-2">
      {puedeConfirmar && (
        <AccionConTexto
          tono="positivo"
          minimo={3}
          accion={(ref) => confirmarPago(numero, ref)}
          exito="Pago confirmado: el pedido ya se puede preparar"
          boton="Confirmar pago recibido"
          placeholder="N.º de comprobante o referencia"
          etiqueta={`Comprobante del pedido ${numero}`}
        />
      )}
      {puedeCancelar && (
        <AccionConTexto
          accion={(motivo) => cancelarPedido(numero, motivo)}
          exito="Pedido cancelado y stock devuelto"
          boton="Cancelar pedido"
          placeholder="Motivo de la cancelación"
          etiqueta={`Motivo de cancelación del pedido ${numero}`}
        />
      )}
    </div>
  );
}
