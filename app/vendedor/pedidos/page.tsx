import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Store, Truck } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { METODOS_PAGO_TEXTO, type DireccionPedido, type EstadoPedido } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";
import { FILTRO_POR_ATENDER } from "@/lib/ventas";

export const metadata: Metadata = { title: "Pedidos" };

const POR_PAGINA = 20;
const FILTROS = {
  atender: "Por atender",
  todos: "Todos",
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagados",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviados",
  ENTREGADO: "Entregados",
  CANCELADO: "Cancelados",
} as const;
type Filtro = keyof typeof FILTROS;

type Props = { searchParams: Promise<{ estado?: string; q?: string; page?: string }> };

export default async function PedidosVendedorPage({ searchParams }: Props) {
  await requireRole("VENDEDOR", "ADMIN");
  const sp = await searchParams;
  const filtro: Filtro = sp.estado && sp.estado in FILTROS ? (sp.estado as Filtro) : "atender";
  const q = (sp.q ?? "").trim().replace(/^#/, "").slice(0, 60);

  const porEstado: Prisma.OrderWhereInput =
    filtro === "atender" ? FILTRO_POR_ATENDER : filtro === "todos" ? {} : { estado: filtro as EstadoPedido };
  const porTexto: Prisma.OrderWhereInput = q
    ? /^\d+$/.test(q)
      ? { numero: Number(q) }
      : { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } }
    : {};
  const where: Prisma.OrderWhereInput = { AND: [porEstado, porTexto] };

  const total = await prisma.order.count({ where });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number(sp.page) || 1), paginas);
  const pedidos = await prisma.order.findMany({
    where,
    // Por atender: los más antiguos primero (se despachan antes). Resto: los más nuevos primero.
    orderBy: { createdAt: filtro === "atender" ? "asc" : "desc" },
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: {
      numero: true,
      estado: true,
      metodoPago: true,
      total: true,
      createdAt: true,
      descuentoDistribuidor: true,
      direccionEnvio: true,
      guiaEnvio: true,
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  const url = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { estado: filtro !== "atender" ? filtro : undefined, q: q || undefined, ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    return `/vendedor/pedidos${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca-navy">Pedidos</h1>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar pedidos" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {(Object.keys(FILTROS) as Filtro[]).map((f) => (
            <Link
              key={f}
              href={url({ estado: f === "atender" ? undefined : f, page: undefined })}
              aria-current={filtro === f ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${filtro === f ? "border-marca-azul bg-marca-azul text-white" : "bg-white text-marca-navy hover:bg-accent"}`}
            >
              {FILTROS[f]}
            </Link>
          ))}
        </nav>
        <form className="relative lg:w-64" action="/vendedor/pedidos">
          {filtro !== "atender" && <input type="hidden" name="estado" value={filtro} />}
          <label htmlFor="buscar-pedido" className="sr-only">Buscar por número, nombre o correo</label>
          <input id="buscar-pedido" name="q" defaultValue={q} placeholder="N.º de pedido, nombre o correo" className="h-9 w-full rounded-lg border border-input bg-white pr-9 pl-3 text-sm outline-none focus:border-ring" />
          <Search className="absolute top-2.5 right-3 size-4 text-marca-gris" />
        </form>
      </div>

      <p className="text-sm text-marca-gris">{total} {total === 1 ? "pedido" : "pedidos"}</p>

      {pedidos.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-marca-gris">No hay pedidos con este filtro.</p>
      ) : (
        <ul className="space-y-2">
          {pedidos.map((p) => {
            const retiro = (p.direccionEnvio as DireccionPedido).tipo === "RETIRO";
            const dir = p.direccionEnvio as DireccionPedido;
            return (
              <li key={p.numero}>
                <Link href={`/vendedor/pedidos/${p.numero}`} className="grid gap-2 rounded-xl border bg-card p-4 transition hover:border-marca-cyan sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-marca-navy">#{p.numero}</span>
                      <EstadoBadge estado={p.estado} />
                      {Number(p.descuentoDistribuidor) > 0 && <span className="rounded bg-marca-cyan/15 px-1.5 py-0.5 text-[11px] font-semibold text-marca-navy">Distribuidor</span>}
                    </p>
                    <p className="text-sm">
                      {p.user.name ?? p.user.email} · {p._count.items} {p._count.items === 1 ? "producto" : "productos"} · {METODOS_PAGO_TEXTO[p.metodoPago]}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-marca-gris">
                      {retiro ? <Store className="size-3.5" /> : <Truck className="size-3.5" />}
                      {retiro ? "Retiro en tienda" : `${dir.ciudad}, ${dir.provincia}`}
                      {p.guiaEnvio && ` · Guía ${p.guiaEnvio}`} · {fechaEC(p.createdAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 font-bold text-marca-azul sm:justify-end">
                    {formatoUSD(p.total)} <ChevronRight className="size-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link href={url({ page: String(pagina - 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              <ChevronLeft className="size-4" /> Anterior
            </Link>
          )}
          <span className="text-marca-gris">Página {pagina} de {paginas}</span>
          {pagina < paginas && (
            <Link href={url({ page: String(pagina + 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              Siguiente <ChevronRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
