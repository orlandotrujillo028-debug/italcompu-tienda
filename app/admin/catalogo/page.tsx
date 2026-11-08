import type { Metadata } from "next";
import { CategoriasAdmin, MarcasAdmin } from "@/components/admin/catalogo";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categorías y marcas" };

export default async function CatalogoAdminPage() {
  await requireRole("ADMIN");
  // Aquí se ven TODAS (incluidas las ocultas), a diferencia del menú de la tienda.
  const [categorias, marcas] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { orden: "asc" },
      select: {
        id: true, nombre: true, slug: true, icono: true, imagen: true, orden: true, activa: true,
        _count: { select: { products: true } },
        children: { orderBy: { orden: "asc" }, select: { id: true, nombre: true, orden: true, activa: true, _count: { select: { products: true } } } },
      },
    }),
    prisma.brand.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, _count: { select: { products: true } } } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-marca-navy">Categorías</h1>
          <p className="text-sm text-marca-gris">Toca una categoría para ver sus subcategorías. “Visible” la muestra u oculta en la tienda. Solo se pueden borrar las que no tienen productos.</p>
        </div>
        <CategoriasAdmin
          categorias={categorias.map((c) => ({
            ...c,
            productos: c._count.products,
            children: c.children.map((s) => ({ id: s.id, nombre: s.nombre, orden: s.orden, activa: s.activa, productos: s._count.products })),
          }))}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-marca-navy">Marcas</h2>
        <MarcasAdmin marcas={marcas.map((m) => ({ id: m.id, nombre: m.nombre, productos: m._count.products }))} />
      </section>
    </div>
  );
}
