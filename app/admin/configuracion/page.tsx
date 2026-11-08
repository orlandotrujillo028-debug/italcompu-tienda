import type { Metadata } from "next";
import { ConfiguracionForm } from "@/components/admin/configuracion-form";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CLAVES_CONFIG, type ConfiguracionInput } from "@/lib/validaciones/configuracion";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await requireRole("ADMIN");
  const filas = await prisma.setting.findMany({ where: { clave: { in: CLAVES_CONFIG } } });
  const valores = Object.fromEntries(CLAVES_CONFIG.map((k) => [k, filas.find((f) => f.clave === k)?.valor ?? ""])) as ConfiguracionInput;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca-navy">Configuración de la tienda</h1>
        <p className="text-sm text-marca-gris">Los cambios se aplican de inmediato en toda la tienda.</p>
      </div>
      <ConfiguracionForm valores={valores} />
    </div>
  );
}
