// Textos y colores de los estados de pedido (los usan cliente, vendedor y admin).

export type EstadoPedido = "PENDIENTE_PAGO" | "PAGADO" | "PREPARANDO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";
export type MetodoPago = "TARJETA" | "TRANSFERENCIA" | "CONTRA_ENTREGA";

export const ESTADOS_PEDIDO: Record<EstadoPedido, { texto: string; color: string }> = {
  PENDIENTE_PAGO: { texto: "Pendiente de pago", color: "bg-amber-100 text-amber-800" },
  PAGADO: { texto: "Pagado", color: "bg-emerald-100 text-emerald-800" },
  PREPARANDO: { texto: "Preparando", color: "bg-sky-100 text-sky-800" },
  ENVIADO: { texto: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  ENTREGADO: { texto: "Entregado", color: "bg-emerald-100 text-emerald-800" },
  CANCELADO: { texto: "Cancelado", color: "bg-red-100 text-red-800" },
};

export const METODOS_PAGO_TEXTO: Record<MetodoPago, string> = {
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CONTRA_ENTREGA: "Contra entrega",
};

/** Pasos de la línea de tiempo, en orden. */
export const PASOS_PEDIDO: { estado: EstadoPedido; titulo: string; detalle: string }[] = [
  { estado: "PENDIENTE_PAGO", titulo: "Pedido recibido", detalle: "Registramos tu pedido." },
  { estado: "PAGADO", titulo: "Pago confirmado", detalle: "Tu pago fue validado." },
  { estado: "PREPARANDO", titulo: "Preparando", detalle: "Estamos alistando tus productos." },
  { estado: "ENVIADO", titulo: "Enviado", detalle: "Tu pedido va en camino." },
  { estado: "ENTREGADO", titulo: "Entregado", detalle: "¡Disfruta tu compra!" },
];

/** Posición del estado en la línea de tiempo (-1 si está cancelado). */
export function indicePaso(estado: EstadoPedido): number {
  return PASOS_PEDIDO.findIndex((p) => p.estado === estado);
}

/** Copia de la dirección guardada en el pedido (Order.direccionEnvio). */
export type DireccionPedido = {
  tipo?: "DOMICILIO" | "RETIRO";
  nombre?: string;
  telefono?: string;
  provincia?: string;
  ciudad?: string;
  direccion?: string;
  referencia?: string | null;
  horario?: string;
};
