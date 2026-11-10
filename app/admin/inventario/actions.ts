"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { ErrorInventario, leerInventarioExcel } from "@/lib/inventario/leer-excel";
import { aplicarCarga, guardarCarga } from "@/lib/inventario/sincronizar";
import { prisma } from "@/lib/prisma";

type Resultado = { ok: true } | { error: string };
export type EstadoSubida = { error?: string } | undefined;

const MAX_BYTES = 8 * 1024 * 1024;

/** Sube el Excel: lo guarda como nueva carga (no toca la tienda) y lleva a la comparación. */
export async function subirInventario(_prev: EstadoSubida, formData: FormData): Promise<EstadoSubida> {
  const admin = await requireRole("ADMIN");
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige el archivo de inventario (.xls o .xlsx)." };
  if (archivo.size > MAX_BYTES) return { error: "El archivo pesa más de 8 MB." };

  let id: string;
  try {
    const leido = leerInventarioExcel(Buffer.from(await archivo.arrayBuffer()));
    id = await guardarCarga(prisma, leido, archivo.name, admin.id);
    await registrarActividad(admin.id, "inventario.subido", `${archivo.name} · ${leido.filas.length} productos · ${leido.sucursal}`);
  } catch (e) {
    if (e instanceof ErrorInventario) return { error: e.message };
    console.error("subirInventario", e);
    return { error: "No se pudo leer el archivo. Revisa que sea el inventario exportado por el sistema." };
  }
  revalidatePath("/admin/inventario");
  redirect(`/admin/inventario/${id}`);
}

/** Aplica una carga a la tienda: crea los productos nuevos, actualiza stock y precios y oculta los que faltan. */
export async function aplicarInventario(cargaId: string): Promise<Resultado> {
  const admin = await requireRole("ADMIN");
  const carga = await prisma.inventarioCarga.findUnique({ where: { id: cargaId }, select: { archivo: true, aplicadaEn: true } });
  if (!carga) return { error: "La carga ya no existe." };
  // Solo se aplica la carga más reciente: aplicar una vieja devolvería precios y stock pasados.
  const ultima = await prisma.inventarioCarga.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } });
  if (ultima?.id !== cargaId) return { error: "Solo se puede aplicar el inventario más reciente." };
  try {
    const r = await aplicarCarga(prisma, cargaId);
    await registrarActividad(
      admin.id,
      "inventario.aplicado",
      `${carga.archivo} · ${r.crear} nuevos, ${r.actualizar} actualizados, ${r.ocultar} ocultados, ${r.reactivar} reactivados`,
    );
  } catch (e) {
    console.error("aplicarInventario", e);
    return { error: "No se pudo aplicar el inventario. Intenta de nuevo." };
  }
  revalidateTag("productos");
  revalidateTag("categorias");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Borra una carga subida por error (no cambia la tienda). */
export async function eliminarCarga(cargaId: string): Promise<Resultado> {
  const admin = await requireRole("ADMIN");
  const carga = await prisma.inventarioCarga.findUnique({ where: { id: cargaId }, select: { archivo: true, aplicadaEn: true } });
  if (!carga) return { error: "La carga ya no existe." };
  if (carga.aplicadaEn) return { error: "Esta carga ya se aplicó a la tienda: se conserva como historial." };
  await prisma.inventarioCarga.delete({ where: { id: cargaId } });
  await registrarActividad(admin.id, "inventario.eliminado", carga.archivo);
  revalidatePath("/admin/inventario");
  return { ok: true };
}
