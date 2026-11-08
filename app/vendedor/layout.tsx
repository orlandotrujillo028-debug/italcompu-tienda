import type { Metadata } from "next";
import { LayoutDashboard, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { NavPanel, type ItemNav } from "@/components/paneles/nav-panel";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Panel de ventas", template: "%s | Ventas ITALCOMPU" }, robots: { index: false } };

// Panel del PERSONAL de ITALCOMPU (rol VENDEDOR): productos y pedidos. El ADMIN también entra.
export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireRole("VENDEDOR", "ADMIN");

  const items: ItemNav[] = [
    { href: "/vendedor", texto: "Resumen", icono: <LayoutDashboard />, exacto: true },
    { href: "/vendedor/productos", texto: "Productos", icono: <Package /> },
    { href: "/vendedor/pedidos", texto: "Pedidos", icono: <ShoppingBag /> },
  ];
  if (usuario.rol === "ADMIN") items.push({ href: "/admin", texto: "Administración", icono: <ShieldCheck /> });

  return (
    <PanelShell titulo="Panel de ventas">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <NavPanel items={items} titulo="Secciones del panel de ventas" />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PanelShell>
  );
}
