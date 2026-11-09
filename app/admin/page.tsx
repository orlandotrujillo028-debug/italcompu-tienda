import Link from "next/link";
import { BadgePercent, Banknote, CalendarClock, Package, ShoppingBag, TrendingUp, UserPlus } from "lucide-react";
import { Bienvenida } from "@/components/paneles/panel-shell";
import { GraficoVentas } from "@/components/vendedor/grafico-ventas";
import { requireRole } from "@/lib/auth-guards";
import { formatoUSD } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { ESTADOS_VENTA, inicioDiaEC, inicioMesEC, ventasPorDia } from "@/lib/ventas";

export default async function AdminInicio() {
  const admin = await requireRole("ADMIN");
  const mes = inicioMesEC();
  const ventaMes = { createdAt: { gte: mes }, estado: { in: ESTADOS_VENTA } };

  const [publico, distribuidores, hoy, nuevos, prodPend, distPend, transf, dias, top] = await Promise.all([
    prisma.order.aggregate({ where: { ...ventaMes, descuentoDistribuidor: 0 }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...ventaMes, descuentoDistribuidor: { gt: 0 } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.count({ where: { createdAt: { gte: inicioDiaEC(0) } } }),
    prisma.user.count({ where: { rol: "CLIENTE", createdAt: { gte: inicioDiaEC(29) } } }),
    prisma.product.count({ where: { estado: "PENDIENTE" } }),
    prisma.distributorProfile.count({ where: { estado: "PENDIENTE" } }),
    prisma.order.count({ where: { estado: "PENDIENTE_PAGO", metodoPago: "TRANSFERENCIA" } }),
    ventasPorDia(30),
    prisma.orderItem.groupBy({
      by: ["productId", "nombre", "codigo"],
      where: { order: { createdAt: { gte: inicioDiaEC(29) }, estado: { in: ESTADOS_VENTA } } },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    }),
  ]);

  const totalMes = Number(publico._sum.total ?? 0) + Number(distribuidores._sum.total ?? 0);
  const pendientes = [
    { texto: "Productos por aprobar", n: prodPend, href: "/admin/productos", Icono: Package },
    { texto: "Distribuidores por aprobar", n: distPend, href: "/admin/distribuidores", Icono: BadgePercent },
    { texto: "Transferencias por confirmar", n: transf, href: "/vendedor/pedidos?estado=PENDIENTE_PAGO", Icono: Banknote },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={admin.name ?? "Admin"} texto="Así va ITALCOMPU este mes." />

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <li className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-marca-gris"><TrendingUp className="size-4 text-marca-azul" /> Ventas del mes</p>
          <p className="text-2xl font-bold text-marca-navy tabular-nums">{formatoUSD(totalMes)}</p>
          <p className="text-xs text-marca-gris">{publico._count._all + distribuidores._count._all} pedidos</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="text-sm text-marca-gris">Público / Distribuidores</p>
          <p className="text-lg font-bold text-marca-navy tabular-nums">{formatoUSD(publico._sum.total ?? 0)}</p>
          <p className="text-sm font-semibold text-marca-azul tabular-nums">{formatoUSD(distribuidores._sum.total ?? 0)}</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-marca-gris"><CalendarClock className="size-4 text-marca-azul" /> Pedidos de hoy</p>
          <p className="text-2xl font-bold text-marca-navy tabular-nums">{hoy}</p>
          <Link href="/vendedor/pedidos?estado=todos" className="text-xs text-marca-azul hover:underline">Ver pedidos</Link>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-marca-gris"><UserPlus className="size-4 text-marca-azul" /> Clientes nuevos</p>
          <p className="text-2xl font-bold text-marca-navy tabular-nums">{nuevos}</p>
          <p className="text-xs text-marca-gris">últimos 30 días</p>
        </li>
      </ul>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold text-marca-navy">Por revisar</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {pendientes.map(({ texto, n, href, Icono }) => (
            <li key={texto}>
              <Link href={href} className={`flex items-center gap-3 rounded-lg border p-3 transition hover:border-marca-cyan ${n > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
                <Icono className={`size-5 ${n > 0 ? "text-amber-700" : "text-marca-gris"}`} />
                <span className="flex-1 text-sm">{texto}</span>
                <span className={`text-xl font-bold tabular-nums ${n > 0 ? "text-amber-800" : "text-marca-gris"}`}>{n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-1 font-bold text-marca-navy">Ventas de los últimos 30 días</h2>
          <GraficoVentas dias={dias} />
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-marca-navy"><ShoppingBag className="size-5 text-marca-azul" /> Más vendidos (30 días)</h2>
          {top.length === 0 ? (
            <p className="text-sm text-marca-gris">Aún no hay ventas.</p>
          ) : (
            <ol className="space-y-2">
              {top.map((t, i) => (
                <li key={t.productId} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-marca-navy">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1">{t.nombre}</span>
                    <span className="text-xs text-marca-gris">{t.codigo}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{t._sum.cantidad} u.</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
