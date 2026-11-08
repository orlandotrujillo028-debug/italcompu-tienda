import "server-only";
import { getMenuCategorias } from "@/lib/catalogo";
import { getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

/** Lo que necesita el formulario de producto: categorías, marcas y configuración de precios. */
export async function datosFormularioProducto() {
  const [categorias, marcas, config] = await Promise.all([
    getMenuCategorias(),
    prisma.brand.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    getConfigPrecios(),
  ]);
  return {
    categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre, children: c.children.map((s) => ({ id: s.id, nombre: s.nombre })) })),
    marcas,
    config,
  };
}

/** Siguiente código libre con el formato ITC-#### (sugerencia para productos nuevos). */
export async function siguienteCodigo() {
  const filas = await prisma.product.findMany({ where: { codigo: { startsWith: "ITC-" } }, select: { codigo: true } });
  const max = filas.reduce((m, f) => Math.max(m, Number(f.codigo.slice(4)) || 0), 999);
  return `ITC-${max + 1}`;
}
