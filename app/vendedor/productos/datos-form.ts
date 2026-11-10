import "server-only";
import { getMenuCategorias } from "@/lib/catalogo";
import { leerReglasPrecio } from "@/lib/inventario/reglas-precio";
import { prisma } from "@/lib/prisma";

/** Lo que necesita el formulario de producto: categorías, marcas y configuración de precios. */
export async function datosFormularioProducto() {
  const [categorias, marcas, reglas] = await Promise.all([
    getMenuCategorias(),
    prisma.brand.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    leerReglasPrecio(prisma),
  ]);
  return {
    categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre, children: c.children.map((s) => ({ id: s.id, nombre: s.nombre, utilidad: reglas.utilidadDe(s.id) })),
    })),
    marcas,
    config: { iva: reglas.iva, utilidadDistribuidor: reglas.utilidadDistribuidor },
  };
}

/** Siguiente código libre con el formato ITC-#### (sugerencia para productos nuevos). */
export async function siguienteCodigo() {
  const filas = await prisma.product.findMany({ where: { codigo: { startsWith: "ITC-" } }, select: { codigo: true } });
  const max = filas.reduce((m, f) => Math.max(m, Number(f.codigo.slice(4)) || 0), 999);
  return `ITC-${max + 1}`;
}
