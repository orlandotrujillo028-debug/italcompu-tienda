import Link from "next/link";
import { BadgeCheck, BadgePercent, Clock, ShieldAlert, XCircle } from "lucide-react";
import type { UsuarioActual } from "@/lib/auth-guards";

/** Tarjeta en "Mi cuenta" con el estado de distribuidor del cliente. */
export function EstadoDistribuidor({ distribuidor, descuento }: { distribuidor: UsuarioActual["distribuidor"]; descuento: number }) {
  const base = "flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between";
  const boton = "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85";

  if (!distribuidor) {
    return (
      <section className={`${base} bg-card`}>
        <div className="flex gap-3">
          <BadgePercent className="mt-0.5 size-6 shrink-0 text-marca-cyan" />
          <div>
            <h2 className="font-semibold text-marca-navy">¿Tienes un local de tecnología?</h2>
            <p className="text-sm text-marca-gris">
              Solicita ser distribuidor y compra con {descuento > 0 ? `${descuento} % de descuento` : "precios especiales"}.
            </p>
          </div>
        </div>
        <Link href="/cuenta/distribuidor" className={boton}>
          Solicitar
        </Link>
      </section>
    );
  }

  const estados = {
    APROBADO: { Icono: BadgeCheck, color: "text-emerald-600", titulo: `Distribuidor aprobado · ${distribuidor.nombreLocal}`, texto: `Ya ves precios de distribuidor${descuento > 0 ? ` (${descuento} % menos)` : ""} en toda la tienda.` },
    PENDIENTE: { Icono: Clock, color: "text-marca-cyan", titulo: "Solicitud de distribuidor en revisión", texto: "Mientras la revisamos ves los precios normales. Te avisaremos por correo." },
    RECHAZADO: { Icono: XCircle, color: "text-destructive", titulo: "Solicitud de distribuidor no aprobada", texto: distribuidor.motivoRechazo ? `Motivo: ${distribuidor.motivoRechazo}` : "Puedes corregir tus datos y volver a enviarla." },
    SUSPENDIDO: { Icono: ShieldAlert, color: "text-destructive", titulo: "Precios de distribuidor suspendidos", texto: "Escríbenos para revisar tu caso." },
  } as const;
  const { Icono, color, titulo, texto } = estados[distribuidor.estado];

  return (
    <section className={`${base} bg-card`}>
      <div className="flex gap-3">
        <Icono className={`mt-0.5 size-6 shrink-0 ${color}`} />
        <div>
          <h2 className="font-semibold text-marca-navy">{titulo}</h2>
          <p className="text-sm text-marca-gris">{texto}</p>
        </div>
      </div>
      {distribuidor.estado === "RECHAZADO" && (
        <Link href="/cuenta/distribuidor" className={boton}>
          Volver a solicitar
        </Link>
      )}
    </section>
  );
}
