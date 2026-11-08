import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CarruselProductos, ItemCarrusel } from "@/components/home/carrusel-productos";
import { ProductCard } from "@/components/producto/product-card";
import { IconoCategoria } from "@/components/tienda/iconos";
import type { ProductoTarjeta } from "@/lib/catalogo";
import type { Tarifa } from "@/lib/precios-calculo";

type Comun = { tarifa: Tarifa; deseos: Set<string> };

/** Encabezado de sección: título + enlace "Ver todo". */
function Encabezado({ titulo, icono, href }: { titulo: string; icono?: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-marca-navy sm:text-2xl">
        {icono}
        {titulo}
      </h2>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-marca-azul hover:underline">
          Ver todo
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Fila({ productos, tarifa, deseos, etiqueta }: Comun & { productos: ProductoTarjeta[]; etiqueta: string }) {
  return (
    <CarruselProductos etiqueta={etiqueta}>
      {productos.map((p) => (
        <ItemCarrusel key={p.id}>
          <ProductCard producto={p} tarifa={tarifa} enDeseos={deseos.has(p.id)} />
        </ItemCarrusel>
      ))}
    </CarruselProductos>
  );
}

/** Vitrina simple: título + carrusel (Destacados, Nuevos). */
export function Vitrina({ titulo, icono, href, productos, ...comun }: Comun & { titulo: string; icono?: React.ReactNode; href?: string; productos: ProductoTarjeta[] }) {
  if (productos.length === 0) return null;
  return (
    <section className="space-y-4">
      <Encabezado titulo={titulo} icono={icono} href={href} />
      <Fila productos={productos} etiqueta={titulo} {...comun} />
    </section>
  );
}

/** Vitrina de una categoría: título con icono, chips de subcategorías y carrusel. */
export function VitrinaCategoria({
  categoria,
  ...comun
}: Comun & {
  categoria: { nombre: string; slug: string; icono: string | null; children: { id: string; nombre: string; slug: string }[]; productos: ProductoTarjeta[] };
}) {
  return (
    <section className="space-y-3">
      <Encabezado
        titulo={categoria.nombre}
        href={`/categoria/${categoria.slug}`}
        icono={<IconoCategoria nombre={categoria.icono} className="size-6 text-marca-cyan" />}
      />
      {categoria.children.length > 0 && (
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoria.children.map((s) => (
            <li key={s.id} className="shrink-0">
              <Link
                href={`/categoria/${s.slug}`}
                className="block rounded-full border bg-white px-3.5 py-1.5 text-sm whitespace-nowrap text-marca-navy hover:border-marca-cyan hover:bg-accent"
              >
                {s.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Fila productos={categoria.productos} etiqueta={categoria.nombre} {...comun} />
    </section>
  );
}
