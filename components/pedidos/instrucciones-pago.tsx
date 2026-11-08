import { Banknote, Clock, CreditCard, HandCoins } from "lucide-react";
import { SimularPago } from "@/components/checkout/simular-pago";
import { IconoMarca } from "@/components/tienda/iconos";
import { getConfigTienda } from "@/lib/config-tienda";
import { formatoUSD } from "@/lib/formato";
import { getConfigEnvio } from "@/lib/pedido";
import type { DireccionPedido, EstadoPedido, MetodoPago } from "@/lib/pedidos-ui";

type Props = {
  pedido: { numero: number; estado: EstadoPedido; metodoPago: MetodoPago; total: { toString(): string }; direccionEnvio: unknown };
  /** El botón de pago simulado solo lo ve el dueño del pedido. */
  esDueno: boolean;
};

/** Qué tiene que hacer el cliente para pagar, según la forma de pago elegida. */
export async function InstruccionesPago({ pedido, esDueno }: Props) {
  const [envio, tienda] = await Promise.all([getConfigEnvio(), getConfigTienda()]);
  const retiro = (pedido.direccionEnvio as DireccionPedido).tipo === "RETIRO";
  const pendiente = pedido.estado === "PENDIENTE_PAGO";
  const whatsapp = tienda.whatsapp
    ? `https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(`Hola ITALCOMPU, envío el comprobante del pedido #${pedido.numero}.`)}`
    : null;

  return (
    <section className="space-y-3 rounded-xl border bg-card p-5">
      {pedido.metodoPago === "TRANSFERENCIA" && (
        <>
          <h2 className="flex items-center gap-2 font-bold text-marca-navy">
            <Banknote className="size-5 text-marca-azul" /> {pendiente ? "Datos para tu transferencia" : "Pago por transferencia"}
          </h2>
          {pendiente ? (
            <>
              <p className="text-sm">
                Transfiere <strong className="text-marca-azul">{formatoUSD(pedido.total)}</strong> e indica el número de pedido <strong>#{pedido.numero}</strong>.
              </p>
              <pre className="rounded-lg bg-marca-fondo p-3 font-sans text-sm whitespace-pre-wrap">{envio.datosBancarios || "Te enviaremos los datos bancarios por correo."}</pre>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E] hover:underline">
                  <IconoMarca marca="whatsapp" className="size-4" /> Enviar comprobante por WhatsApp
                </a>
              )}
              <p className="flex items-center gap-1.5 text-xs text-marca-gris">
                <Clock className="size-3.5" /> Despachamos cuando validemos tu pago.
              </p>
            </>
          ) : (
            <p className="text-sm text-marca-gris">Tu transferencia fue registrada.</p>
          )}
        </>
      )}
      {pedido.metodoPago === "TARJETA" && (
        <>
          <h2 className="flex items-center gap-2 font-bold text-marca-navy">
            <CreditCard className="size-5 text-marca-azul" /> Pago con tarjeta
          </h2>
          <p className="text-sm">{pendiente ? "Tu pago está pendiente de confirmación." : "Tu pago fue aprobado."}</p>
          {pendiente && esDueno && process.env.NODE_ENV !== "production" && <SimularPago numero={pedido.numero} />}
        </>
      )}
      {pedido.metodoPago === "CONTRA_ENTREGA" && (
        <>
          <h2 className="flex items-center gap-2 font-bold text-marca-navy">
            <HandCoins className="size-5 text-marca-azul" /> {retiro ? "Pago al retirar" : "Pago contra entrega"}
          </h2>
          <p className="text-sm">
            {pedido.estado === "ENTREGADO" ? (
              "Pagado al recibir."
            ) : (
              <>
                Ten listo <strong className="text-marca-azul">{formatoUSD(pedido.total)}</strong> {retiro ? "al retirar en la tienda." : "en efectivo al recibir tu pedido."}
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
