import { IconoMarca } from "@/components/tienda/iconos";
import { cn } from "@/lib/utils";

/**
 * Botón para productos sin stock: en lugar de "Agotado", abre WhatsApp con el producto ya escrito
 * (ruta /consultar/[codigo]). Así no se pierde la venta: puede haber en otra sucursal o llegar pronto.
 */
export function BotonConsultar({ codigo, grande = false, className }: { codigo: string; grande?: boolean; className?: string }) {
  return (
    <a
      href={`/consultar/${encodeURIComponent(codigo)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg border border-[#25D366] font-medium text-[#0f7a6e] transition hover:bg-[#25D366]/10",
        grande ? "h-11 text-base" : "h-9 text-sm",
        className,
      )}
    >
      <IconoMarca marca="whatsapp" className={grande ? "size-5" : "size-4"} />
      Consultar disponibilidad
    </a>
  );
}
