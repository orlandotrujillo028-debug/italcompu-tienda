import { formatoPct } from "@/lib/formato";
import { BadgePercent, Clock, Store } from "lucide-react";

/** Explica en 3 líneas qué gana un local al ser distribuidor. */
export function BeneficiosDistribuidor({ descuento }: { descuento: number }) {
  const items = [
    { Icono: BadgePercent, texto: descuento > 0 ? `Precios hasta ${formatoPct(descuento)} % más bajos en todo el catálogo.` : "Precios especiales en todo el catálogo." },
    { Icono: Store, texto: "Para locales del mismo giro: tiendas de computación, servicio técnico, integradores." },
    { Icono: Clock, texto: "Revisamos tu RUC y activamos tus precios en cuanto aprobemos la solicitud." },
  ];
  return (
    <ul className="space-y-2 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
      {items.map(({ Icono, texto }) => (
        <li key={texto} className="flex gap-2">
          <Icono className="mt-0.5 size-4 shrink-0 text-marca-azul" />
          {texto}
        </li>
      ))}
    </ul>
  );
}
