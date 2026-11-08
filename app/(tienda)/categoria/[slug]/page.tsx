import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Listado } from "@/components/listado/listado";
import { getIdsDeseos } from "@/lib/catalogo";
import { leerFiltros, listarProductos } from "@/lib/listado";
import { aConsulta } from "@/lib/params";
import { getTarifa } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getCategoria = cache((slug: string) =>
  prisma.category.findFirst({
    where: { slug, activa: true },
    select: {
      id: true,
      nombre: true,
      slug: true,
      parent: { select: { nombre: true, slug: true } },
      children: { where: { activa: true }, select: { id: true } },
    },
  }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoria((await params).slug);
  if (!cat) return { title: "Categoría no encontrada" };
  const nombre = cat.parent ? `${cat.nombre} · ${cat.parent.nombre}` : cat.nombre;
  return {
    title: nombre,
    description: `Compra ${nombre.toLowerCase()} en ITALCOMPU: precios con IVA, garantía local y envíos a todo Ecuador.`,
    alternates: { canonical: `/categoria/${cat.slug}` },
  };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategoria(slug);
  if (!cat) notFound();

  const esPrincipal = !cat.parent;
  const filtros = leerFiltros(sp);
  const [tarifa, deseos] = await Promise.all([getTarifa(), getIdsDeseos()]);
  const resultado = await listarProductos(
    {
      categoriaIds: [cat.id, ...cat.children.map((c) => c.id)],
      facetaSubcategorias: esPrincipal, // en una subcategoría ya no tiene sentido
    },
    filtros,
    tarifa,
  );

  const migas = cat.parent
    ? [{ nombre: cat.parent.nombre, href: `/categoria/${cat.parent.slug}` }, { nombre: cat.nombre }]
    : [{ nombre: cat.nombre }];

  return (
    <Listado
      titulo={cat.nombre}
      descripcion={cat.parent ? <>Subcategoría de {cat.parent.nombre}</> : undefined}
      migas={migas}
      ruta={`/categoria/${cat.slug}`}
      consulta={aConsulta(sp)}
      resultado={resultado}
      tarifa={tarifa}
      deseos={deseos}
    />
  );
}
