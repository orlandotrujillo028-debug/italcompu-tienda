import { IconoMarca } from "@/components/tienda/iconos";

/** Botón flotante de WhatsApp con mensaje predefinido (número desde Configuración). */
export function WhatsAppFlotante({ url }: { url: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#0f7a6e] p-3.5 text-white shadow-lg transition hover:scale-105 hover:shadow-xl sm:right-6 sm:bottom-6"
    >
      <IconoMarca marca="whatsapp" className="size-7" />
      <span className="hidden pr-1 text-sm font-semibold group-hover:inline">¿Te ayudamos?</span>
    </a>
  );
}
