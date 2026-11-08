import type { Metadata } from "next";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Administración", template: "%s | Admin ITALCOMPU" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN"); // segunda barrera, con datos frescos de la base
  return <PanelShell titulo="Administración">{children}</PanelShell>;
}
