import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetallePedido, EstadoBadge, LineaTiempo } from "@/components/pedidos/detalle-pedido";
import { InstruccionesPago } from "@/components/pedidos/instrucciones-pago";
import { requireUser } from "@/lib/auth-guards";
import { METODOS_PAGO_TEXTO } from "@/lib/pedidos-ui";
import { fechaEC } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ numero: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Pedido #${(await params).numero}` };
}

export default async function PedidoClientePage({ params }: Props) {
  const usuario = await requireUser();
  const numero = Number((await params).numero);
  if (!Number.isInteger(numero) || numero < 1) notFound();

  // findFirst con userId: si el pedido es de otra persona, simplemente "no existe".
  const pedido = await prisma.order.findFirst({
    where: { numero, userId: usuario.id },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
  if (!pedido) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/cuenta/pedidos" className="text-sm text-marca-azul hover:underline">
          ← Mis pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-marca-navy">Pedido #{pedido.numero}</h1>
          <EstadoBadge estado={pedido.estado} />
        </div>
        <p className="text-sm text-marca-gris">
          {fechaEC(pedido.createdAt, "conHora")} · Pago:{" "}
          {METODOS_PAGO_TEXTO[pedido.metodoPago]}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-bold text-marca-navy">Estado del pedido</h2>
        <LineaTiempo estado={pedido.estado} contraEntrega={pedido.metodoPago === "CONTRA_ENTREGA"} />
      </section>

      {pedido.estado === "PENDIENTE_PAGO" && <InstruccionesPago pedido={pedido} esDueno />}
      <DetallePedido pedido={pedido} />
    </div>
  );
}
