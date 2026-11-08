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

const getMarca = cache((slug: string) => prisma.brand.findUnique({ where: { slug }, select: { id: true, nombre: true, slug: true } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const marca = await getMarca((await params).slug);
  if (!marca) return { title: "Marca no encontrada" };
  return {
    title: `Productos ${marca.nombre}`,
    description: `Stock de productos ${marca.nombre} en ITALCOMPU con garantía local y envíos a todo Ecuador.`,
    alternates: { canonical: `/marca/${marca.slug}` },
  };
}

export default async function MarcaPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const marca = await getMarca(slug);
  if (!marca) notFound();

  const [tarifa, deseos] = await Promise.all([getTarifa(), getIdsDeseos()]);
  const consulta = aConsulta(sp);
  delete consulta.marca; // en la página de una marca, el filtro de marca no aplica
  const resultado = await listarProductos({ marcaId: marca.id, facetaSubcategorias: true }, { ...leerFiltros(sp), marcas: [] }, tarifa);

  return (
    <Listado
      titulo={marca.nombre}
      descripcion="Stock disponible de esta marca"
      migas={[{ nombre: "Marcas", href: "/marcas" }, { nombre: marca.nombre }]}
      ruta={`/marca/${marca.slug}`}
      consulta={consulta}
      resultado={{ ...resultado, facetas: { ...resultado.facetas, marcas: [] } }}
      tarifa={tarifa}
      deseos={deseos}
      tituloSub="Categoría"
    />
  );
}
