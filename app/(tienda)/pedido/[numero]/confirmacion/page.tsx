import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, CheckCircle2, Clock, CreditCard, HandCoins, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimularPago } from "@/components/checkout/simular-pago";
import { IconoMarca } from "@/components/tienda/iconos";
import { requireUser } from "@/lib/auth-guards";
import { getConfigTienda } from "@/lib/config-tienda";
import { formatoUSD } from "@/lib/formato";
import { getConfigEnvio } from "@/lib/pedido";
import { calcularPrecio } from "@/lib/precios-calculo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pedido recibido", robots: { index: false } };

type Props = { params: Promise<{ numero: string }> };

const ESTADOS: Record<string, { texto: string; color: string }> = {
  PENDIENTE_PAGO: { texto: "Pendiente de pago", color: "bg-amber-100 text-amber-800" },
  PAGADO: { texto: "Pagado", color: "bg-emerald-100 text-emerald-800" },
  PREPARANDO: { texto: "Preparando", color: "bg-sky-100 text-sky-800" },
  ENVIADO: { texto: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  ENTREGADO: { texto: "Entregado", color: "bg-emerald-100 text-emerald-800" },
  CANCELADO: { texto: "Cancelado", color: "bg-red-100 text-red-800" },
};

type DireccionGuardada = { tipo?: string; nombre?: string; telefono?: string; provincia?: string; ciudad?: string; direccion?: string; referencia?: string | null; horario?: string };

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

  const [envio, tienda] = await Promise.all([getConfigEnvio(), getConfigTienda()]);
  const dir = pedido.direccionEnvio as DireccionGuardada;
  const iva = Number(pedido.subtotal) > 0 ? Math.round((Number(pedido.iva) / Number(pedido.subtotal)) * 100) : 15;
  const estado = ESTADOS[pedido.estado];
  const whatsapp = tienda.whatsapp
    ? `https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(`Hola ITALCOMPU, envío el comprobante del pedido #${pedido.numero}.`)}`
    : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
        <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">¡Gracias por tu compra!</h1>
        <p className="text-marca-gris">
          Tu pedido <strong className="text-marca-navy">#{pedido.numero}</strong> fue recibido el{" "}
          {pedido.createdAt.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${estado.color}`}>{estado.texto}</span>
      </header>

      {/* Instrucciones según la forma de pago */}
      <section className="space-y-3 rounded-xl border bg-card p-5">
        {pedido.metodoPago === "TRANSFERENCIA" && (
          <>
            <h2 className="flex items-center gap-2 font-bold text-marca-navy"><Banknote className="size-5 text-marca-azul" /> Datos para tu transferencia</h2>
            <p className="text-sm">
              Transfiere <strong className="text-marca-azul">{formatoUSD(pedido.total)}</strong> e indica el número de pedido <strong>#{pedido.numero}</strong>.
            </p>
            <pre className="rounded-lg bg-marca-fondo p-3 font-sans text-sm whitespace-pre-wrap">{envio.datosBancarios || "Te enviaremos los datos bancarios por correo."}</pre>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E] hover:underline">
                <IconoMarca marca="whatsapp" className="size-4" /> Enviar comprobante por WhatsApp
              </a>
            )}
            <p className="flex items-center gap-1.5 text-xs text-marca-gris"><Clock className="size-3.5" /> Despachamos cuando validemos tu pago.</p>
          </>
        )}
        {pedido.metodoPago === "TARJETA" && (
          <>
            <h2 className="flex items-center gap-2 font-bold text-marca-navy"><CreditCard className="size-5 text-marca-azul" /> Pago con tarjeta</h2>
            <p className="text-sm">
              {pedido.estado === "PAGADO" ? "Tu pago fue aprobado. Ya estamos preparando tu pedido." : "Tu pago está pendiente de confirmación."}
            </p>
            {pedido.estado === "PENDIENTE_PAGO" && process.env.NODE_ENV !== "production" && <SimularPago numero={pedido.numero} />}
          </>
        )}
        {pedido.metodoPago === "CONTRA_ENTREGA" && (
          <>
            <h2 className="flex items-center gap-2 font-bold text-marca-navy"><HandCoins className="size-5 text-marca-azul" /> {dir.tipo === "RETIRO" ? "Pago al retirar" : "Pago contra entrega"}</h2>
            <p className="text-sm">
              Ten listo <strong className="text-marca-azul">{formatoUSD(pedido.total)}</strong> {dir.tipo === "RETIRO" ? "al retirar en la tienda." : "en efectivo al recibir tu pedido."}
            </p>
          </>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-xl border bg-card p-5 text-sm">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-marca-navy">
            {dir.tipo === "RETIRO" ? <Store className="size-5 text-marca-azul" /> : <MapPin className="size-5 text-marca-azul" />}
            {dir.tipo === "RETIRO" ? "Retiro en tienda" : "Entrega"}
          </h2>
          <p className="font-medium">{dir.nombre}</p>
          <p>{dir.direccion}</p>
          {dir.tipo === "RETIRO" ? (
            dir.horario && <p className="text-marca-gris">{dir.horario}</p>
          ) : (
            <>
              <p className="text-marca-gris">{dir.ciudad}, {dir.provincia}</p>
              <p className="text-marca-gris">{dir.telefono}{dir.referencia && ` · ${dir.referencia}`}</p>
              <p className="text-marca-gris">Courier: {pedido.courier}</p>
            </>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 text-sm">
          <h2 className="mb-2 font-bold text-marca-navy">Totales</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1">
            <dt className="text-marca-gris">Subtotal sin IVA</dt><dd className="text-right">{formatoUSD(pedido.subtotal)}</dd>
            <dt className="text-marca-gris">IVA ({iva} %)</dt><dd className="text-right">{formatoUSD(pedido.iva)}</dd>
            <dt className="text-marca-gris">Envío</dt><dd className="text-right">{Number(pedido.envio) === 0 ? "Gratis" : formatoUSD(pedido.envio)}</dd>
            <dt className="border-t pt-1 font-bold text-marca-navy">Total</dt><dd className="border-t pt-1 text-right font-bold text-marca-azul">{formatoUSD(pedido.total)}</dd>
          </dl>
          {Number(pedido.descuentoDistribuidor) > 0 && (
            <p className="mt-2 text-xs text-emerald-700">Incluye {Number(pedido.descuentoDistribuidor)} % de descuento de distribuidor.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold text-marca-navy">Productos</h2>
        <ul className="divide-y text-sm">
          {pedido.items.map((i) => {
            // Mismo cálculo y redondeo que al cobrar (precioSinIva ya incluye el descuento si lo hubo).
            const unitario = calcularPrecio(i.precioSinIva, { iva, esDistribuidor: false, descuento: 0 }).conIva;
            return (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <Link href={`/producto/${i.product.slug}`} className="font-medium hover:text-marca-azul">{i.nombre}</Link>
                  <span className="block text-xs text-marca-gris">Código {i.codigo} · {i.cantidad} × {formatoUSD(unitario)}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatoUSD(unitario * i.cantidad)}</span>
              </li>
            );
          })}
        </ul>
        {pedido.notas && <p className="mt-3 rounded-lg bg-marca-fondo p-3 text-sm"><strong>Tus notas:</strong> {pedido.notas}</p>}
      </section>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg"><Link href="/cuenta">Ver mis pedidos</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/">Seguir comprando</Link></Button>
      </div>
    </main>
  );
}
