import type { Prisma } from "@prisma/client";
import type { EstadoPedido } from "@/lib/pedidos-ui";
import { FILTRO_POR_ATENDER } from "@/lib/ventas";

/** Filtros de la lista de pedidos (los mismos se usan para exportar a CSV). */
export const FILTROS_PEDIDO = {
  atender: "Por atender",
  todos: "Todos",
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagados",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviados",
  ENTREGADO: "Entregados",
  CANCELADO: "Cancelados",
} as const;
export type FiltroPedido = keyof typeof FILTROS_PEDIDO;

const OFFSET_EC_MS = -5 * 60 * 60 * 1000;
const fecha = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Lee estado, búsqueda y rango de fechas (días de Ecuador) y arma el where de Prisma. */
export function leerFiltroPedidos(sp: { estado?: string; q?: string; desde?: string; hasta?: string }) {
  const filtro: FiltroPedido = sp.estado && sp.estado in FILTROS_PEDIDO ? (sp.estado as FiltroPedido) : "atender";
  const q = (sp.q ?? "").trim().replace(/^#/, "").slice(0, 60);
  const desde = fecha(sp.desde);
  const hasta = fecha(sp.hasta);

  const porEstado: Prisma.OrderWhereInput = filtro === "atender" ? FILTRO_POR_ATENDER : filtro === "todos" ? {} : { estado: filtro as EstadoPedido };
  const porTexto: Prisma.OrderWhereInput = q
    ? /^\d+$/.test(q)
      ? { numero: Number(q) }
      : { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } }
    : {};
  // 00:00 de Ecuador del día "desde" hasta las 00:00 del día siguiente a "hasta".
  const porFecha: Prisma.OrderWhereInput =
    desde || hasta
      ? {
          createdAt: {
            ...(desde ? { gte: new Date(new Date(`${desde}T00:00:00Z`).getTime() - OFFSET_EC_MS) } : {}),
            ...(hasta ? { lt: new Date(new Date(`${hasta}T00:00:00Z`).getTime() - OFFSET_EC_MS + 86_400_000) } : {}),
          },
        }
      : {};

  return { filtro, q, desde, hasta, where: { AND: [porEstado, porTexto, porFecha] } as Prisma.OrderWhereInput };
}
