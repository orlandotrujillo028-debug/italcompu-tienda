"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { MOTIVO_OCULTO } from "@/lib/inventario/sincronizar";
import { prisma } from "@/lib/prisma";

type Resultado = { ok: true } | { error: string };

const mostrarSchema = z
  .array(z.object({ id: z.string().min(1).max(40), stock: z.coerce.number().int("El stock debe ser un número entero").min(0).max(100_000) }))
  .min(1, "Marca al menos un producto.")
  .max(1000);

function refrescar() {
  revalidateTag("productos");
  revalidateTag("categorias");
  revalidatePath("/", "layout");
}

/**
 * Vuelve a publicar productos que el inventario ocultó (no venían en el Excel de la sucursal).
 * Quedan con `stockManual`: el próximo inventario no los oculta ni cambia su stock, hasta que
 * vuelvan a aparecer en un Excel (entonces el Excel manda otra vez).
 */
export async function mostrarOcultos(datos: unknown): Promise<Resultado> {
  const admin = await requireRole("ADMIN");
  const v = mostrarSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };

  const ids = v.data.map((d) => d.id);
  const productos = await prisma.product.findMany({
    where: { id: { in: ids }, estado: "BORRADOR", motivoRechazo: MOTIVO_OCULTO },
    select: { id: true, codigo: true, categoryId: true, category: { select: { parentId: true } } },
  });
  if (productos.length === 0) return { error: "Esos productos ya no están ocultos. Recarga la página." };
  const stockDe = new Map(v.data.map((d) => [d.id, d.stock]));

  await prisma.$transaction([
    ...productos.map((p) =>
      prisma.product.update({
        where: { id: p.id },
        data: { estado: "PUBLICADO", motivoRechazo: null, stockManual: true, stock: stockDe.get(p.id) ?? 0 },
      }),
    ),
    // Su categoría (y la principal) deben verse en la tienda.
    prisma.category.updateMany({
      where: { id: { in: productos.flatMap((p) => [p.categoryId, p.category.parentId]).filter((x): x is string => Boolean(x)) } },
      data: { activa: true },
    }),
  ]);
  await registrarActividad(
    admin.id,
    "inventario.mostrados",
    `${productos.length} productos mostrados a mano: ${productos.map((p) => `${p.codigo} (${stockDe.get(p.id)})`).join(", ")}`.slice(0, 900),
  );
  refrescar();
  revalidatePath("/admin/inventario/ocultos");
  return { ok: true };
}

/** Deshace "mostrar a mano": lo oculta otra vez y el inventario vuelve a mandar sobre él. */
export async function volverAOcultar(id: unknown): Promise<Resultado> {
  const admin = await requireRole("ADMIN");
  const v = z.string().min(1).max(40).safeParse(id);
  if (!v.success) return { error: "Producto no válido." };
  const p = await prisma.product.findFirst({ where: { id: v.data, stockManual: true }, select: { codigo: true } });
  if (!p) return { error: "Ese producto ya no está mostrado a mano." };
  await prisma.product.update({
    where: { id: v.data },
    data: { estado: "BORRADOR", motivoRechazo: MOTIVO_OCULTO, stockManual: false, stock: 0, destacado: false },
  });
  await registrarActividad(admin.id, "inventario.ocultado", p.codigo);
  refrescar();
  revalidatePath("/admin/inventario/ocultos");
  return { ok: true };
}
