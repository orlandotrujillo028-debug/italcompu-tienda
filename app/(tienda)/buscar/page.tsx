import type { Metadata } from "next";
import Link from "next/link";
import { Listado } from "@/components/listado/listado";
import { getIdsDeseos } from "@/lib/catalogo";
import { leerFiltros, listarProductos } from "@/lib/listado";
import { aConsulta } from "@/lib/params";
import { getTarifa } from "@/lib/precios";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const texto = (sp: Record<string, string | string[] | undefined>) => (Array.isArray(sp.q) ? sp.q[0] : (sp.q ?? "")).trim().slice(0, 80);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = texto(await searchParams);
  // Las páginas de búsqueda no se indexan en Google.
  return { title: q ? `Resultados para “${q}”` : "Buscar", robots: { index: false, follow: true } };
}

export default async function BuscarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = texto(sp);
  const [tarifa, deseos] = await Promise.all([getTarifa(), getIdsDeseos()]);
  const filtros = leerFiltros(sp);
  const resultado = q
    ? await listarProductos({ texto: q, facetaSubcategorias: true }, filtros, tarifa)
    : { productos: [], total: 0, pagina: 1, paginas: 1, facetas: { marcas: [], subcategorias: [], precioMin: null, precioMax: null } };

  return (
    <Listado
      titulo={q ? `Resultados para “${q}”` : "Buscar productos"}
      descripcion={q ? "Buscamos en el nombre, el código y la marca" : "Escribe lo que necesitas en el buscador de arriba."}
      migas={[{ nombre: "Búsqueda" }]}
      ruta="/buscar"
      consulta={aConsulta(sp)}
      resultado={resultado}
      tarifa={tarifa}
      deseos={deseos}
      tituloSub="Categoría"
      vacio={
        <>
          <p className="font-semibold text-marca-navy">{q ? `No encontramos productos para “${q}”.` : "¿Qué estás buscando?"}</p>
          <p className="max-w-md text-sm text-marca-gris">
            Revisa la ortografía, prueba con menos palabras o con el código del producto (ej. ITC-1005).
          </p>
          <Link href="/marcas" className="text-sm font-medium text-marca-azul hover:underline">
            Ver productos por marca
          </Link>
        </>
      }
    />
  );
}
