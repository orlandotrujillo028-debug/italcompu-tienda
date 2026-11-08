import "server-only";
import { prisma } from "@/lib/prisma";
import type { EstadoPedido } from "@/lib/pedidos-ui";

/*
 * Cifras de ventas para los paneles.
 * Cuenta como VENTA un pedido pagado o en curso (no los pendientes de pago ni los cancelados).
 * Los días se agrupan en hora de Ecuador (UTC−5, sin horario de verano).
 */

export const ESTADOS_VENTA: EstadoPedido[] = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"];
const OFFSET_EC_MS = -5 * 60 * 60 * 1000;

/** "YYYY-MM-DD" del día en Ecuador para una fecha. */
const diaEC = (d: Date) => new Date(d.getTime() + OFFSET_EC_MS).toISOString().slice(0, 10);

/** Inicio (en UTC) del día de Ecuador que está `dias` días atrás. */
export function inicioDiaEC(diasAtras: number) {
  const hoy = diaEC(new Date());
  const inicio = new Date(`${hoy}T00:00:00.000Z`).getTime() - OFFSET_EC_MS; // 00:00 de Ecuador en UTC
  return new Date(inicio - diasAtras * 86_400_000);
}

/** Inicio del mes actual en Ecuador. */
export function inicioMesEC() {
  const [a, m] = diaEC(new Date()).split("-");
  return new Date(new Date(`${a}-${m}-01T00:00:00.000Z`).getTime() - OFFSET_EC_MS);
}

export type DiaVenta = { dia: string; etiqueta: string; total: number; pedidos: number };

/** Ventas por día de los últimos `dias` días (incluye hoy y los días sin ventas). */
export async function ventasPorDia(dias = 30): Promise<DiaVenta[]> {
  const desde = inicioDiaEC(dias - 1);
  const pedidos = await prisma.order.findMany({
    where: { createdAt: { gte: desde }, estado: { in: ESTADOS_VENTA } },
    select: { createdAt: true, total: true },
  });

  const mapa = new Map<string, { total: number; pedidos: number }>();
  for (const p of pedidos) {
    const d = diaEC(p.createdAt);
    const actual = mapa.get(d) ?? { total: 0, pedidos: 0 };
    mapa.set(d, { total: actual.total + Number(p.total), pedidos: actual.pedidos + 1 });
  }

  return Array.from({ length: dias }, (_, i) => {
    const fecha = new Date(desde.getTime() + i * 86_400_000 - OFFSET_EC_MS);
    const dia = fecha.toISOString().slice(0, 10);
    const v = mapa.get(dia) ?? { total: 0, pedidos: 0 };
    const [, mes, d] = dia.split("-");
    return { dia, etiqueta: `${Number(d)}/${Number(mes)}`, total: Math.round(v.total * 100) / 100, pedidos: v.pedidos };
  });
}

/** Total vendido y número de pedidos en el mes actual. */
export async function ventasDelMes() {
  const r = await prisma.order.aggregate({
    where: { createdAt: { gte: inicioMesEC() }, estado: { in: ESTADOS_VENTA } },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { total: Number(r._sum.total ?? 0), pedidos: r._count._all };
}

/**
 * Pedidos que el personal debe atender:
 * pagados, en preparación, y los contra entrega recién recibidos.
 */
export const FILTRO_POR_ATENDER = {
  OR: [{ estado: { in: ["PAGADO", "PREPARANDO"] as EstadoPedido[] } }, { estado: "PENDIENTE_PAGO" as const, metodoPago: "CONTRA_ENTREGA" as const }],
};
