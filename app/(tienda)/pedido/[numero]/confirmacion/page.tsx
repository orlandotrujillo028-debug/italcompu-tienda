import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetallePedido, EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { InstruccionesPago } from "@/components/pedidos/instrucciones-pago";
import { requireUser } from "@/lib/auth-guards";
import { fechaEC } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pedido recibido", robots: { index: false } };

type Props = { params: Promise<{ numero: string }> };

export default async function ConfirmacionPage({ params }: Props) {
  const usuario = await requireUser();
  const numero = Number((await params).numero);
  if (!Number.isInteger(numero) || numero < 1) notFound();

  // Solo el dueño del pedido (o el personal) puede verlo.
  const pedido = await prisma.order.findFirst({
    where: { numero, ...(usuario.rol === "CLIENTE" ? { userId: usuario.id } : {}) },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
  if (!pedido) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
        <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">¡Gracias por tu compra!</h1>
        <p className="text-marca-gris">
          Tu pedido <strong className="text-marca-navy">#{pedido.numero}</strong> fue recibido el{" "}
          {fechaEC(pedido.createdAt, "larga")}.
        </p>
        <EstadoBadge estado={pedido.estado} className="px-3 py-1 text-sm" />
      </header>

      <InstruccionesPago pedido={pedido} esDueno={pedido.userId === usuario.id} />
      <DetallePedido pedido={pedido} />

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={`/cuenta/pedidos/${pedido.numero}`}>Seguir mi pedido</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>
    </main>
  );
}
