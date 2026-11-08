import type { Metadata } from "next";
import { Clock, ShieldAlert } from "lucide-react";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Panel de vendedor", template: "%s | Vendedor ITALCOMPU" } };

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireRole("VENDEDOR");
  const tienda = usuario.vendorProfile;
  const titulo = tienda?.nombreTienda ?? "Panel de vendedor";

  // Mientras la tienda no esté APROBADA no ve nada del panel (ni subpáginas).
  if (tienda?.estado !== "APROBADO") {
    const suspendida = tienda?.estado === "SUSPENDIDO";
    const Icono = suspendida ? ShieldAlert : Clock;
    return (
      <PanelShell titulo={titulo}>
        <section className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <Icono className={`mx-auto size-12 ${suspendida ? "text-destructive" : "text-marca-cyan"}`} />
          <h1 className="mt-4 text-2xl font-bold text-marca-navy">
            {suspendida ? "Tu cuenta está suspendida" : "Tu cuenta está en revisión"}
          </h1>
          <p className="mt-2 text-marca-gris">
            {suspendida
              ? "Por ahora no puedes publicar ni gestionar productos. Escríbenos para más información."
              : "Gracias por registrar tu tienda. Nuestro equipo revisará tus datos y te avisaremos por correo cuando puedas empezar a publicar productos."}
          </p>
        </section>
      </PanelShell>
    );
  }

  return <PanelShell titulo={titulo}>{children}</PanelShell>;
}
