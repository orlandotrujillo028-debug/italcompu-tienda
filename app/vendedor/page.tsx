import Link from "next/link";
import { AlertTriangle, ChevronRight, Clock, PackageCheck, TrendingUp } from "lucide-react";
import { Bienvenida } from "@/components/paneles/panel-shell";
import { EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { GraficoVentas } from "@/components/vendedor/grafico-ventas";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { FILTRO_POR_ATENDER, ventasDelMes, ventasPorDia } from "@/lib/ventas";

export default async function VendedorInicio() {
  const vendedor = await requireRole("VENDEDOR", "ADMIN");
  const [mes, dias, porAtender, publicados, pendientes, stockBajo, ultimos] = await Promise.all([
    ventasDelMes(),
    ventasPorDia(30),
    prisma.order.count({ where: FILTRO_POR_ATENDER }),
    prisma.product.count({ where: { estado: "PUBLICADO" } }),
    prisma.product.count({ where: { estado: "PENDIENTE" } }),
    prisma.product.findMany({
      where: { estado: "PUBLICADO", stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, codigo: true, nombre: true, stock: true },
    }),
    prisma.order.findMany({
      where: FILTRO_POR_ATENDER,
      orderBy: { createdAt: "asc" }, // los más antiguos primero: hay que despacharlos antes
      take: 5,
      select: { numero: true, estado: true, total: true, createdAt: true, descuentoDistribuidor: true, user: { select: { name: true } } },
    }),
  ]);

  const tarjetas = [
    { titulo: "Ventas del mes", valor: formatoUSD(mes.total), detalle: `${mes.pedidos} pedidos`, Icono: TrendingUp, href: "/vendedor/pedidos" },
    { titulo: "Pedidos por atender", valor: porAtender, detalle: "pagados o en preparación", Icono: Clock, href: "/vendedor/pedidos?estado=atender" },
    { titulo: "Productos publicados", valor: publicados, detalle: `${pendientes} esperando aprobación`, Icono: PackageCheck, href: "/vendedor/productos" },
    { titulo: "Stock bajo (≤ 5)", valor: stockBajo.length, detalle: "productos publicados", Icono: AlertTriangle, href: "/vendedor/productos?stock=bajo" },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={vendedor.name ?? "equipo"} texto="Resumen de ventas, pedidos por despachar y productos con poco stock." />

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tarjetas.map(({ titulo, valor, detalle, Icono, href }) => (
          <li key={titulo}>
            <Link href={href} className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 transition hover:border-marca-cyan">
              <span className="flex items-center gap-2 text-sm text-marca-gris">
                <Icono className="size-4 text-marca-azul" /> {titulo}
              </span>
              <span className="text-2xl font-bold text-marca-navy tabular-nums">{valor}</span>
              <span className="text-xs text-marca-gris">{detalle}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-bold text-marca-navy">Ventas de los últimos 30 días</h2>
        <GraficoVentas dias={dias} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-marca-navy">Pedidos por atender</h2>
            <Link href="/vendedor/pedidos?estado=atender" className="text-sm text-marca-azul hover:underline">Ver todos</Link>
          </div>
          {ultimos.length === 0 ? (
            <p className="text-sm text-marca-gris">No hay pedidos pendientes de despacho. 🎉</p>
          ) : (
            <ul className="divide-y">
              {ultimos.map((p) => (
                <li key={p.numero}>
                  <Link href={`/vendedor/pedidos/${p.numero}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-marca-azul">
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">#{p.numero}</span> · {p.user.name}
                      {Number(p.descuentoDistribuidor) > 0 && <span className="ml-1 rounded bg-marca-cyan/15 px-1.5 text-[11px] font-semibold text-marca-navy">Distribuidor</span>}
                      <span className="block text-xs text-marca-gris">{fechaEC(p.createdAt)} · {formatoUSD(p.total)}</span>
                    </span>
                    <EstadoBadge estado={p.estado} />
                    <ChevronRight className="size-4 text-marca-gris" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-bold text-marca-navy">Alertas de stock bajo</h2>
          {stockBajo.length === 0 ? (
            <p className="text-sm text-marca-gris">Todo el catálogo tiene más de 5 unidades.</p>
          ) : (
            <ul className="divide-y">
              {stockBajo.map((p) => (
                <li key={p.id}>
                  <Link href={`/vendedor/productos/${p.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-marca-azul">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1">{p.nombre}</span>
                      <span className="text-xs text-marca-gris">{p.codigo}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.stock === 0 ? "Agotado" : `${p.stock} u.`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
