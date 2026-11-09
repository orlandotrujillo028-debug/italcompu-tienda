import Link from "next/link";
import { Home, LayoutGrid, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMenuCategorias } from "@/lib/catalogo";

/** 404 dentro de la tienda (con header y footer): producto, categoría o página que no existe. */
export default async function NoEncontrado() {
  const categorias = (await getMenuCategorias()).slice(0, 8);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-center">
      <div className="space-y-3">
        <p className="text-7xl font-extrabold text-marca-azul">404</p>
        <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">No encontramos esta página</h1>
        <p className="text-marca-gris">Puede que el producto ya no esté disponible o que el enlace tenga un error.</p>
      </div>

      <form action="/buscar" role="search" className="mx-auto flex max-w-md gap-2">
        <label htmlFor="buscar-404" className="sr-only">Buscar productos</label>
        <input id="buscar-404" name="q" placeholder="Busca por producto, código o marca…" className="h-11 min-w-0 flex-1 rounded-full border-2 border-marca-azul/25 bg-white px-4 text-sm outline-none focus:border-marca-cyan" />
        <Button type="submit" size="lg" className="h-11 rounded-full"><Search /> Buscar</Button>
      </form>

      <div className="space-y-3">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-marca-navy"><LayoutGrid className="size-4" /> O explora una categoría</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {categorias.map((c) => (
            <li key={c.id}>
              <Link href={`/categoria/${c.slug}`} className="block rounded-full border bg-white px-3.5 py-1.5 text-sm text-marca-navy hover:border-marca-cyan hover:bg-accent">
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Button asChild variant="outline"><Link href="/"><Home /> Volver al inicio</Link></Button>
    </main>
  );
}
