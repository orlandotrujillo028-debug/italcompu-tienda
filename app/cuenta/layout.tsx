import type { Metadata } from "next";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = { title: { default: "Mi cuenta", template: "%s | Mi cuenta ITALCOMPU" } };

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <PanelShell titulo="Mi cuenta">{children}</PanelShell>;
}
