import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgePercent, Mail, Phone, UserRound } from "lucide-react";
import { DetallePedido, EstadoBadge, LineaTiempo } from "@/components/pedidos/detalle-pedido";
import { GestionPedido } from "@/components/vendedor/gestion-pedido";
import { requireRole } from "@/lib/auth-guards";
import { siguientesEstados } from "@/lib/flujo-pedido";
import { fechaEC } from "@/lib/formato";
import { METODOS_PAGO_TEXTO } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ numero: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Pedido #${(await params).numero}` };
}

export default async function PedidoVendedorPage({ params }: Props) {
  await requireRole("VENDEDOR", "ADMIN");
  const numero = Number((await params).numero);
  if (!Number.isInteger(numero) || numero < 1) notFound();

  const pedido = await prisma.order.findUnique({
    where: { numero },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      user: { select: { name: true, email: true, telefono: true, cedula: true, distribuidor: { select: { nombreLocal: true, ruc: true } } } },
    },
  });
  if (!pedido) notFound();

  const esDistribuidor = Number(pedido.descuentoDistribuidor) > 0;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/vendedor/pedidos" className="text-sm text-marca-azul hover:underline">← Pedidos</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-marca-navy">Pedido #{pedido.numero}</h1>
          <EstadoBadge estado={pedido.estado} />
          {esDistribuidor && (
            <span className="inline-flex items-center gap-1 rounded bg-marca-cyan/15 px-2 py-0.5 text-xs font-semibold text-marca-navy">
              <BadgePercent className="size-3.5" /> Distribuidor ({Number(pedido.descuentoDistribuidor)} %)
            </span>
          )}
        </div>
        <p className="text-sm text-marca-gris">
          {fechaEC(pedido.createdAt, "conHora")} · Pago: {METODOS_PAGO_TEXTO[pedido.metodoPago]}
          {pedido.referenciaPago && ` · Ref. ${pedido.referenciaPago}`}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-bold text-marca-navy">Atender pedido</h2>
          <GestionPedido numero={pedido.numero} estado={pedido.estado} siguientes={siguientesEstados(pedido)} guiaActual={pedido.guiaEnvio} />
          <div className="border-t pt-4">
            <LineaTiempo estado={pedido.estado} contraEntrega={pedido.metodoPago === "CONTRA_ENTREGA"} />
          </div>
        </section>

        <section className="space-y-2 rounded-xl border bg-card p-5 text-sm">
          <h2 className="mb-1 font-bold text-marca-navy">Cliente</h2>
          <p className="flex items-center gap-2"><UserRound className="size-4 text-marca-cyan" /> {pedido.user.name ?? "Sin nombre"}</p>
          <p className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0 text-marca-cyan" /> {pedido.user.email}</p>
          {pedido.user.telefono && <p className="flex items-center gap-2"><Phone className="size-4 text-marca-cyan" /> {pedido.user.telefono}</p>}
          {pedido.user.cedula && <p className="text-marca-gris">Cédula/RUC: {pedido.user.cedula}</p>}
          {pedido.user.distribuidor && esDistribuidor && (
            <p className="rounded-lg bg-marca-fondo p-2 text-xs">
              Local: <strong>{pedido.user.distribuidor.nombreLocal}</strong> · RUC {pedido.user.distribuidor.ruc}
            </p>
          )}
        </section>
      </div>

      <DetallePedido pedido={pedido} />
    </div>
  );
}
