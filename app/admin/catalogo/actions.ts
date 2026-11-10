"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { registrarActividad } from "@/lib/actividad";
import { requireRole } from "@/lib/auth-guards";
import { recalcularPrecios } from "@/lib/inventario/sincronizar";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

type R = { ok: true } | { error: string };

function refrescar() {
  revalidateTag("categorias");
  revalidateTag("productos");
  revalidatePath("/admin/catalogo");
}

/** Slug libre: si ya existe, agrega -2, -3… */
async function slugLibre(base: string, tabla: "category" | "brand") {
  let slug = base || "item";
  for (let i = 2; ; i++) {
    const existe = tabla === "category" ? await prisma.category.findUnique({ where: { slug }, select: { id: true } }) : await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    if (!existe) return slug;
    slug = `${base}-${i}`;
  }
}

const categoriaSchema = z.object({
  id: z.string().max(40).optional(),
  parentId: z.string().max(40).optional(),
  nombre: z.string().trim().min(2, "Nombre muy corto").max(60),
  orden: z.coerce.number().int().min(0).max(999),
  icono: z.string().max(40).optional(),
  imagen: z.string().trim().max(300).optional(),
  activa: z.boolean(),
  // Utilidad para el público (% sobre el costo). Vacío = hereda.
  utilidad: z
    .string()
    .trim()
    .max(10)
    .optional()
    .transform((u) => (u ? Number(u.replace(",", ".")) : null))
    .refine((u) => u === null || (Number.isFinite(u) && u >= 0 && u <= 500), "Utilidad entre 0 y 500 %"),
});

/** Crea o edita una categoría o subcategoría. El slug (dirección web) no cambia al renombrar. */
export async function guardarCategoria(datos: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = categoriaSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa los datos." };
  const d = v.data;
  if (d.imagen && !/^https:\/\/(res\.cloudinary\.com|placehold\.co)\//.test(d.imagen)) return { error: "La imagen debe ser un enlace https de Cloudinary." };

  const campos = { nombre: d.nombre, orden: d.orden, icono: d.icono || null, imagen: d.imagen || null, activa: d.activa, utilidadPublico: d.utilidad };
  let cambiaUtilidad = d.utilidad !== null;
  if (d.id) {
    const antes = await prisma.category.findUnique({ where: { id: d.id }, select: { utilidadPublico: true } });
    if (!antes) return { error: "La categoría no existe." };
    cambiaUtilidad = (antes.utilidadPublico === null ? null : Number(antes.utilidadPublico)) !== d.utilidad;
    await prisma.category.update({ where: { id: d.id }, data: campos });
  } else {
    const padre = d.parentId ? await prisma.category.findFirst({ where: { id: d.parentId, parentId: null }, select: { id: true, slug: true } }) : null;
    if (d.parentId && !padre) return { error: "La categoría principal no existe." };
    const slug = await slugLibre(padre ? `${padre.slug}-${slugify(d.nombre)}` : slugify(d.nombre), "category");
    await prisma.category.create({ data: { ...campos, slug, parentId: padre?.id ?? null } });
  }
  // Nueva utilidad → se recalculan los precios con el costo del inventario.
  const recalculados = cambiaUtilidad ? await recalcularPrecios(prisma) : 0;
  await registrarActividad(
    admin.id,
    d.id ? "categoria.editada" : "categoria.creada",
    `${d.nombre}${d.activa ? "" : " (oculta)"}${cambiaUtilidad ? ` · utilidad ${d.utilidad ?? "heredada"} % · ${recalculados} precios recalculados` : ""}`,
  );
  refrescar();
  return { ok: true };
}

/** Solo se puede borrar si no tiene productos ni subcategorías (si no, ocúltala). */
export async function eliminarCategoria(id: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.string().min(1).max(40).safeParse(id);
  if (!v.success) return { error: "Categoría no válida." };
  const c = await prisma.category.findUnique({ where: { id: v.data }, select: { nombre: true, _count: { select: { products: true, children: true } } } });
  if (!c) return { error: "La categoría no existe." };
  if (c._count.products || c._count.children) return { error: "Tiene productos o subcategorías. Ocúltala en lugar de borrarla." };
  await prisma.category.delete({ where: { id: v.data } });
  await registrarActividad(admin.id, "categoria.eliminada", c.nombre);
  refrescar();
  return { ok: true };
}

const marcaSchema = z.object({ id: z.string().max(40).optional(), nombre: z.string().trim().min(1, "Escribe el nombre").max(60) });

export async function guardarMarca(datos: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = marcaSchema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisa el nombre." };
  try {
    if (v.data.id) await prisma.brand.update({ where: { id: v.data.id }, data: { nombre: v.data.nombre } });
    else await prisma.brand.create({ data: { nombre: v.data.nombre, slug: await slugLibre(slugify(v.data.nombre), "brand") } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Ya existe una marca con ese nombre." };
    throw e;
  }
  await registrarActividad(admin.id, v.data.id ? "marca.editada" : "marca.creada", v.data.nombre);
  refrescar();
  return { ok: true };
}

export async function eliminarMarca(id: unknown): Promise<R> {
  const admin = await requireRole("ADMIN");
  const v = z.string().min(1).max(40).safeParse(id);
  if (!v.success) return { error: "Marca no válida." };
  const m = await prisma.brand.findUnique({ where: { id: v.data }, select: { nombre: true, _count: { select: { products: true } } } });
  if (!m) return { error: "La marca no existe." };
  if (m._count.products) return { error: `Tiene ${m._count.products} productos. Cámbiales la marca antes de borrarla.` };
  await prisma.brand.delete({ where: { id: v.data } });
  await registrarActividad(admin.id, "marca.eliminada", m.nombre);
  refrescar();
  return { ok: true };
}
