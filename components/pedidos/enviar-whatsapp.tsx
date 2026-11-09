import { IconoMarca } from "@/components/tienda/iconos";
import { enlaceWhatsappPedido } from "@/lib/whatsapp-pedido";

/**
 * Tarjeta con el botón para (re)enviar el pedido por WhatsApp.
 * El enlace se arma en el servidor con los datos guardados del pedido.
 */
export async function EnviarPorWhatsapp({ numero, titulo = "Confirma tu pedido por WhatsApp" }: { numero: number; titulo?: string }) {
  const enlace = await enlaceWhatsappPedido(numero);
  if (!enlace) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-[#25D366]/50 bg-[#25D366]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-bold text-marca-navy">{titulo}</h2>
        <p className="text-sm text-marca-gris">
          Si no se abrió WhatsApp o no enviaste el mensaje, tócalo aquí: tu pedido #{numero} ya va escrito. Te respondemos por ahí para coordinar el pago y la entrega.
        </p>
      </div>
      <a
        href={enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0f7a6e] px-5 font-semibold text-white hover:bg-[#075e54]"
      >
        <IconoMarca marca="whatsapp" className="size-5" />
        Enviar por WhatsApp
      </a>
    </section>
  );
}
