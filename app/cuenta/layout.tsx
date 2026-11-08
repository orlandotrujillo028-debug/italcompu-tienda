import type { Metadata } from "next";
import { BadgePercent, Heart, Home, MapPin, Package, UserRound } from "lucide-react";
import { NavPanel, type ItemNav } from "@/components/paneles/nav-panel";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Mi cuenta", template: "%s | Mi cuenta ITALCOMPU" }, robots: { index: false } };

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUser();

  const items: ItemNav[] = [
    { href: "/cuenta", texto: "Inicio", icono: <Home />, exacto: true },
    { href: "/cuenta/pedidos", texto: "Mis pedidos", icono: <Package /> },
    { href: "/cuenta/direcciones", texto: "Direcciones", icono: <MapPin /> },
    { href: "/cuenta/datos", texto: "Mis datos", icono: <UserRound /> },
    { href: "/cuenta/deseos", texto: "Lista de deseos", icono: <Heart /> },
  ];
  if (usuario.rol === "CLIENTE" && usuario.distribuidor?.estado !== "APROBADO") {
    items.push({ href: "/cuenta/distribuidor", texto: "Ser distribuidor", icono: <BadgePercent /> });
  }

  return (
    <PanelShell titulo="Mi cuenta">
      {/* grid-cols-1 + min-w-0: el menú deslizable del móvil no debe ensanchar la página */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <NavPanel items={items} titulo="Secciones de mi cuenta" />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PanelShell>
  );
}
