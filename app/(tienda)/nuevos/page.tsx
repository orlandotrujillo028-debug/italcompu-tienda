import type { Metadata } from "next";
import { Listado } from "@/components/listado/listado";
import { getIdsDeseos } from "@/lib/catalogo";
import { leerFiltros, listarProductos } from "@/lib/listado";
import { aConsulta } from "@/lib/params";
import { getTarifa } from "@/lib/precios";

export const metadata: Metadata = {
  title: "Nuevos productos",
  description: "Lo último en tecnología que llegó a ITALCOMPU.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NuevosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [tarifa, deseos] = await Promise.all([getTarifa(), getIdsDeseos()]);
  const resultado = await listarProductos({ soloNuevos: true, facetaSubcategorias: true }, leerFiltros(sp), tarifa);

  return (
    <Listado
      titulo="Nuevos productos"
      descripcion="Lo último que llegó a nuestra tienda"
      migas={[{ nombre: "Nuevos productos" }]}
      ruta="/nuevos"
      consulta={aConsulta(sp)}
      resultado={resultado}
      tarifa={tarifa}
      deseos={deseos}
      tituloSub="Categoría"
    />
  );
}
