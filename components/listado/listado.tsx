import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/producto/product-card";
import { FiltrosLateral, FiltrosMovil } from "@/components/listado/filtros";
import { Migas, type Miga } from "@/components/listado/migas";
import { Ordenar } from "@/components/listado/ordenar";
import { conParams } from "@/components/listado/url";
import type { ResultadoListado } from "@/lib/listado";
import type { Tarifa } from "@/lib/precios-calculo";

type Props = {
  titulo: string;
  descripcion?: React.ReactNode;
  migas: Miga[];
  ruta: string;
  consulta: Record<string, string>;
  resultado: ResultadoListado;
  tarifa: Tarifa;
  deseos: Set<string>;
  tituloSub?: string;
  vacio?: React.ReactNode;
};

/** Página de listado completa: encabezado, filtros, orden, grilla y paginación. */
export function Listado({ titulo, descripcion, migas, ruta, consulta, resultado, tarifa, deseos, tituloSub, vacio }: Props) {
  const { productos, total, pagina, paginas, facetas } = resultado;
  const filtros = { ruta, consulta, facetas, tituloSub };

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
      <Migas items={migas} />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">{titulo}</h1>
        {descripcion && <div className="text-sm text-marca-gris">{descripcion}</div>}
      </header>

      <div className="flex gap-6">
        <FiltrosLateral {...filtros} />

        <section className="min-w-0 flex-1 space-y-4" aria-label="Productos">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
            <div className="flex items-center gap-3">
              <FiltrosMovil {...filtros} />
              <p className="text-sm text-marca-gris" aria-live="polite">
                <strong className="text-marca-navy">{total}</strong> {total === 1 ? "producto" : "productos"}
              </p>
            </div>
            <Ordenar ruta={ruta} consulta={consulta} />
          </div>

          {productos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-14 text-center">
              <PackageSearch className="size-12 text-marca-cyan" />
              {vacio ?? (
                <>
                  <p className="font-semibold text-marca-navy">No hay productos con estos filtros.</p>
                  <Link href={conParams(ruta, consulta, { marca: null, sub: null, min: null, max: null, stock: null })} className="text-sm font-medium text-marca-azul hover:underline">
                    Quitar filtros
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {productos.map((p, i) => (
                <li key={p.id}>
                  <ProductCard producto={p} tarifa={tarifa} enDeseos={deseos.has(p.id)} prioridad={i < 4} />
                </li>
              ))}
            </ul>
          )}

          {paginas > 1 && <Paginacion ruta={ruta} consulta={consulta} pagina={pagina} paginas={paginas} />}
        </section>
      </div>
    </main>
  );
}

function Paginacion({ ruta, consulta, pagina, paginas }: { ruta: string; consulta: Record<string, string>; pagina: number; paginas: number }) {
  const href = (n: number) => conParams(ruta, consulta, { page: n > 1 ? String(n) : null }, true);
  // Muestra: 1 … (p-1) p (p+1) … último
  const numeros = [...new Set([1, pagina - 1, pagina, pagina + 1, paginas])].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b);
  const boton = "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      {pagina > 1 && (
        <Link href={href(pagina - 1)} className={`${boton} bg-white hover:bg-accent`} aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {numeros.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - numeros[i - 1] > 1 && <span className="text-marca-gris">…</span>}
          <Link
            href={href(n)}
            aria-current={n === pagina ? "page" : undefined}
            className={`${boton} ${n === pagina ? "border-marca-azul bg-marca-azul font-semibold text-white" : "bg-white hover:bg-accent"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {pagina < paginas && (
        <Link href={href(pagina + 1)} className={`${boton} bg-white hover:bg-accent`} aria-label="Página siguiente">
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
