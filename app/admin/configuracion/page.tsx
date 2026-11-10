import type { Metadata } from "next";
import { ConfiguracionForm } from "@/components/admin/configuracion-form";
import { requireRole } from "@/lib/auth-guards";
import { UTILIDAD_DISTRIBUIDOR_POR_DEFECTO, UTILIDAD_PUBLICO_POR_DEFECTO } from "@/lib/precios";
import { prisma } from "@/lib/prisma";
import { CLAVES_CONFIG, type ConfiguracionInput } from "@/lib/validaciones/configuracion";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await requireRole("ADMIN");
  const filas = await prisma.setting.findMany({ where: { clave: { in: CLAVES_CONFIG } } });
  // Si una clave todavía no existe en la base se muestra su valor por defecto (no vacío: vacío sería 0 %).
  const porDefecto: Partial<Record<string, string>> = {
    iva: "15",
    utilidad_publico: String(UTILIDAD_PUBLICO_POR_DEFECTO),
    utilidad_distribuidor: String(UTILIDAD_DISTRIBUIDOR_POR_DEFECTO),
  };
  const valores = Object.fromEntries(
    CLAVES_CONFIG.map((k) => [k, filas.find((f) => f.clave === k)?.valor ?? porDefecto[k] ?? ""]),
  ) as ConfiguracionInput;

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
