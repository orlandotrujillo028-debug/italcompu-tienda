import type { Metadata } from "next";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Panel de ventas", template: "%s | Ventas ITALCOMPU" } };

// Panel del PERSONAL de ITALCOMPU (rol VENDEDOR): productos y pedidos.
export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  await requireRole("VENDEDOR", "ADMIN"); // el admin también puede entrar
  return <PanelShell titulo="Panel de ventas">{children}</PanelShell>;
}
