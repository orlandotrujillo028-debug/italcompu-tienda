import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Categorías principales con sus subcategorías, para el menú.
 * Se guarda en caché 1 hora; el admin la refresca con revalidateTag("categorias") al editar (Paso 11).
 */
export const getMenuCategorias = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { parentId: null, activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        slug: true,
        icono: true,
        children: {
          where: { activa: true },
          orderBy: { orden: "asc" },
          select: { id: true, nombre: true, slug: true },
        },
      },
    }),
  ["menu-categorias"],
  { revalidate: 3600, tags: ["categorias"] },
);

export type CategoriaMenu = Awaited<ReturnType<typeof getMenuCategorias>>[number];
