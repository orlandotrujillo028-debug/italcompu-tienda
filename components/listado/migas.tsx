import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Miga = { nombre: string; href?: string };

/** Migas de pan: Inicio › Categoría › Subcategoría › … */
export function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-marca-gris">
        <li>
          <Link href="/" className="flex items-center gap-1 hover:text-marca-azul">
            <Home className="size-3.5" />
            <span className="sr-only sm:not-sr-only">Inicio</span>
          </Link>
        </li>
        {items.map((m, i) => (
          <li key={`${m.nombre}-${i}`} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0" />
            {m.href && i < items.length - 1 ? (
              <Link href={m.href} className="hover:text-marca-azul">
                {m.nombre}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 font-medium text-marca-navy">
                {m.nombre}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
