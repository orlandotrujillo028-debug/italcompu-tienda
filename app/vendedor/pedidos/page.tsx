import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Search, Store, Truck } from "lucide-react";
import { EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { FILTROS_PEDIDO, leerFiltroPedidos, type FiltroPedido } from "@/lib/filtro-pedidos";
import { METODOS_PAGO_TEXTO, type DireccionPedido } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pedidos" };

const POR_PAGINA = 20;
type Props = { searchParams: Promise<{ estado?: string; q?: string; desde?: string; hasta?: string; page?: string }> };

export default async function PedidosVendedorPage({ searchParams }: Props) {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const sp = await searchParams;
  const { filtro, q, desde, hasta, where } = leerFiltroPedidos(sp);

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

  const parametros = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { estado: filtro !== "atender" ? filtro : undefined, q: q || undefined, desde, hasta, ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    return p;
  };
  const url = (cambios: Record<string, string | undefined>) => {
    const p = parametros(cambios);
    return `/vendedor/pedidos${p.size ? `?${p}` : ""}`;
  };
  const csv = `/admin/pedidos/exportar?${parametros({ page: undefined })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marca-navy">Pedidos</h1>
        {usuario.rol === "ADMIN" && (
          <a href={csv} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-medium text-marca-navy hover:bg-accent">
            <Download className="size-4" /> Exportar CSV
          </a>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <nav aria-label="Filtrar pedidos" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {(Object.keys(FILTROS_PEDIDO) as FiltroPedido[]).map((f) => (
            <Link
              key={f}
              href={url({ estado: f === "atender" ? undefined : f, page: undefined })}
              aria-current={filtro === f ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${filtro === f ? "border-marca-azul bg-marca-azul text-white" : "bg-white text-marca-navy hover:bg-accent"}`}
            >
              {FILTROS_PEDIDO[f]}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap items-end gap-2" action="/vendedor/pedidos">
          {filtro !== "atender" && <input type="hidden" name="estado" value={filtro} />}
          <div className="relative min-w-0 flex-1 sm:max-w-64">
            <label htmlFor="buscar-pedido" className="sr-only">Buscar por número, nombre o correo</label>
            <input id="buscar-pedido" name="q" defaultValue={q} placeholder="N.º de pedido, nombre o correo" className="h-9 w-full rounded-lg border border-input bg-white pr-9 pl-3 text-sm outline-none focus:border-ring" />
            <Search className="absolute top-2.5 right-3 size-4 text-marca-gris" />
          </div>
          <label className="text-xs text-marca-gris">
            Desde
            <input type="date" name="desde" defaultValue={desde} className="mt-0.5 block h-9 rounded-lg border border-input bg-white px-2 text-sm text-foreground" />
          </label>
          <label className="text-xs text-marca-gris">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta} className="mt-0.5 block h-9 rounded-lg border border-input bg-white px-2 text-sm text-foreground" />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-marca-azul px-3 text-sm font-medium text-white hover:bg-marca-navy">Filtrar</button>
          {(desde || hasta || q) && (
            <Link href={url({ q: undefined, desde: undefined, hasta: undefined, page: undefined })} className="flex h-9 items-center text-sm text-destructive hover:underline">
              Limpiar
            </Link>
          )}
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
