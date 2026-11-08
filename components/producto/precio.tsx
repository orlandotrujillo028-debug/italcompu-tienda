import { calcularPrecio, type Tarifa } from "@/lib/precios-calculo";
import { formatoUSD } from "@/lib/formato";

/**
 * Precio de un producto según la tarifa del usuario.
 * Distribuidor: precio público tachado + su precio con la etiqueta "Precio distribuidor".
 */
export function Precio({ precioSinIva, tarifa, tamano = "md" }: { precioSinIva: number; tarifa: Tarifa; tamano?: "md" | "lg" }) {
  const p = calcularPrecio(precioSinIva, tarifa);
  const grande = tamano === "lg" ? "text-3xl" : "text-xl";

  return (
    <div>
      {tarifa.esDistribuidor && p.ahorro > 0 && (
        <p className="text-xs text-marca-gris">
          Público <span className="line-through">{formatoUSD(p.publicoConIva)}</span>
        </p>
      )}
      <p className={`${grande} leading-tight font-extrabold text-marca-azul`}>{formatoUSD(p.conIva)}</p>
      {tarifa.esDistribuidor ? (
        <p className="mt-0.5 inline-block rounded bg-marca-cyan/15 px-1.5 py-0.5 text-[11px] font-semibold text-marca-navy">
          Precio distribuidor · incluye IVA
        </p>
      ) : (
        <p className="text-[11px] text-marca-gris">Precio incluye IVA</p>
      )}
    </div>
  );
}
