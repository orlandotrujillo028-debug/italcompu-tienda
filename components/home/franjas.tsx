import { formatoPct } from "@/lib/formato";
import Link from "next/link";
import { ArrowRight, BadgePercent, CreditCard, ShieldCheck, Store, Truck } from "lucide-react";

/** Franja de beneficios bajo el banner. */
export function Beneficios() {
  const items = [
    { Icono: Truck, titulo: "Envíos a todo Ecuador", texto: "Gratis desde $300" },
    { Icono: ShieldCheck, titulo: "Garantía local", texto: "Productos originales con factura" },
    { Icono: CreditCard, titulo: "Paga como prefieras", texto: "Tarjeta, transferencia o contra entrega" },
    { Icono: Store, titulo: "¿Tienes un local?", texto: "Precios especiales para distribuidores" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ Icono, titulo, texto }) => (
        <li key={titulo} className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-marca-azul sm:size-10">
            <Icono className="size-4.5 sm:size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-marca-navy">{titulo}</span>
            <span className="block text-xs text-marca-gris">{texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Invitación a ser distribuidor (solo para quienes aún no lo son). */
export function InvitacionDistribuidor({ descuento }: { descuento: number }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-marca-navy via-marca-azul to-marca-cyan p-6 text-white shadow-md sm:p-8">
      <BadgePercent className="absolute -right-6 -bottom-8 size-48 text-white/10" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">¿Tienes un local de tecnología?</h2>
          <p className="mt-1 max-w-xl text-white/90">
            Regístrate como distribuidor y compra todo el catálogo
            {descuento > 0 ? ` con hasta ${formatoPct(descuento)} % de descuento` : " a precio especial"}.
          </p>
        </div>
        <Link
          href="/registro-distribuidor"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-marca-navy shadow hover:bg-marca-fondo"
        >
          Quiero ser distribuidor
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
