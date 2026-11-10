import { Truck } from "lucide-react";
import { formatoUSD } from "@/lib/formato";
import type { Cotizacion } from "@/lib/pedido";

/** Caja de totales (carrito y checkout). */
export function Resumen({ c, retiro = false, children }: { c: Cotizacion; retiro?: boolean; children?: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-bold text-marca-navy">Resumen</h2>
      {c.tarifa.esDistribuidor && (
        <p className="rounded-lg bg-marca-cyan/15 px-3 py-2 text-xs font-medium text-marca-navy">
          Precios de distribuidor aplicados{c.ahorroDistribuidor > 0 ? ` (ahorras ${formatoUSD(c.ahorroDistribuidor)})` : ""}.
        </p>
      )}
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-marca-gris">
          Productos ({c.unidades} {c.unidades === 1 ? "unidad" : "unidades"}) sin IVA
        </dt>
        <dd className="text-right">{formatoUSD(c.subtotal)}</dd>
        <dt className="text-marca-gris">IVA ({c.tarifa.iva} %)</dt>
        <dd className="text-right">{formatoUSD(c.iva)}</dd>
        <dt className="text-marca-gris">{retiro ? "Retiro en tienda" : "Envío"}</dt>
        <dd className={`text-right ${c.envio === 0 ? "font-semibold text-emerald-700" : ""}`}>{c.envio === 0 ? "Gratis" : formatoUSD(c.envio)}</dd>
        <dt className="border-t pt-2 text-base font-bold text-marca-navy">Total</dt>
        <dd className="border-t pt-2 text-right text-xl font-extrabold text-marca-azul">{formatoUSD(c.total)}</dd>
      </dl>
      {!retiro && !c.envioGratis && c.faltaParaEnvioGratis > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
          <Truck className="mt-0.5 size-4 shrink-0 text-marca-azul" />
          Te faltan {formatoUSD(c.faltaParaEnvioGratis)} para el envío gratis.
        </p>
      )}
      {children}
    </div>
  );
}
