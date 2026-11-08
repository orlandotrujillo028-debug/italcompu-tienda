import type { DireccionPedido, EstadoPedido, MetodoPago } from "@/lib/pedidos-ui";

/**
 * Qué estados puede poner el PERSONAL a partir del estado actual.
 * (Confirmar transferencias y cancelar lo hace el ADMIN en el Paso 11.)
 */
export function siguientesEstados(p: { estado: EstadoPedido; metodoPago: MetodoPago; direccionEnvio: unknown }): EstadoPedido[] {
  const retiro = (p.direccionEnvio as DireccionPedido)?.tipo === "RETIRO";
  switch (p.estado) {
    case "PENDIENTE_PAGO":
      // Contra entrega se prepara sin pago previo; los demás esperan el pago.
      return p.metodoPago === "CONTRA_ENTREGA" ? ["PREPARANDO"] : [];
    case "PAGADO":
      return ["PREPARANDO"];
    case "PREPARANDO":
      return retiro ? ["ENTREGADO"] : ["ENVIADO"];
    case "ENVIADO":
      return ["ENTREGADO"];
    default:
      return [];
  }
}
