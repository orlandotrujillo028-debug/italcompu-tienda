"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { recalcularPrecios } from "@/lib/inventario/sincronizar";
import { prisma } from "@/lib/prisma";
import { configuracionSchema } from "@/lib/validaciones/configuracion";

export async function guardarConfiguracion(datos: unknown): Promise<{ ok: true } | { error: string }> {
  const admin = await requireRole("ADMIN");
  const v = configuracionSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };

  const anteriores = await prisma.setting.findMany();
  const cambios = Object.entries(v.data).filter(([k, val]) => anteriores.find((a) => a.clave === k)?.valor !== String(val));
  if (cambios.length === 0) return { ok: true };

  await prisma.$transaction(
    cambios.map(([clave, valor]) => prisma.setting.upsert({ where: { clave }, create: { clave, valor: String(valor) }, update: { valor: String(valor) } })),
  );
  // Nueva utilidad para el público → se recalcula el precio de todo el inventario con su costo.
  let recalculados = 0;
  if (cambios.some(([k]) => k === "utilidad_publico")) recalculados = await recalcularPrecios(prisma);

  // Registra qué cambió (sin volcar textos largos como los datos bancarios).
  await registrarActividad(
    admin.id,
    "configuracion.editada",
    cambios.map(([k, val]) => (k === "datos_bancarios" ? "datos_bancarios" : `${k}=${val}`)).join(", ") + (recalculados ? ` · ${recalculados} precios recalculados` : ""),
  );
  // Precios, envío y contacto se leen en cada página: basta con refrescar todo el sitio.
  revalidateTag("productos");
  revalidatePath("/", "layout");
  return { ok: true };
}
