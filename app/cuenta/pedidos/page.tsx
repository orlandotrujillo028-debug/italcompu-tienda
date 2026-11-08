import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { requireUser } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { METODOS_PAGO_TEXTO } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mis pedidos" };

const POR_PAGINA = 10;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function MisPedidosPage({ searchParams }: Props) {
  const usuario = await requireUser();
  const total = await prisma.order.count({ where: { userId: usuario.id } });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Math.floor(Number((await searchParams).page)) || 1), paginas);

  // Siempre filtrado por el usuario: nadie ve pedidos de otra persona.
  const pedidos = await prisma.order.findMany({
    where: { userId: usuario.id },
    orderBy: { createdAt: "desc" },
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: {
      numero: true,
      estado: true,
      metodoPago: true,
      total: true,
      createdAt: true,
      items: { select: { nombre: true, cantidad: true }, take: 2 },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca-navy">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center">
          <Package className="size-10 text-marca-cyan" />
          <p className="font-semibold text-marca-navy">Todavía no has hecho pedidos</p>
          <Link href="/" className="text-sm font-medium text-marca-azul hover:underline">
            Explorar productos
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.numero}>
              <Link href={`/cuenta/pedidos/${p.numero}`} className="block rounded-xl border bg-card p-4 transition hover:border-marca-cyan hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-marca-navy">Pedido #{p.numero}</span>
                  <EstadoBadge estado={p.estado} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-foreground">
                  {p.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(" · ")}
                  {p._count.items > 2 && ` y ${p._count.items - 2} más`}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-marca-gris">
                  <span>
                    {fechaEC(p.createdAt)} · {METODOS_PAGO_TEXTO[p.metodoPago]}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-marca-azul">
                    {formatoUSD(p.total)} <ChevronRight className="size-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 ? (
            <Link href={`/cuenta/pedidos?page=${pagina - 1}`} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              <ChevronLeft className="size-4" /> Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-marca-gris">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link href={`/cuenta/pedidos?page=${pagina + 1}`} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              Siguientes <ChevronRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
