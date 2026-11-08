"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; texto: string; icono: React.ReactNode; exacto?: boolean };

/**
 * Menú de un panel: columna lateral en escritorio, fila deslizable en móvil.
 * Marca la sección actual.
 */
export function NavPanel({ items, titulo }: { items: ItemNav[]; titulo: string }) {
  const ruta = usePathname();
  const activo = (i: ItemNav) => (i.exacto ? ruta === i.href : ruta === i.href || ruta.startsWith(i.href + "/"));

  return (
    <nav aria-label={titulo} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1 lg:rounded-xl lg:border lg:bg-card lg:p-2">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <Link
              href={i.href}
              aria-current={activo(i) ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                activo(i)
                  ? "bg-marca-azul font-semibold text-white"
                  : "border bg-white text-marca-navy hover:bg-accent lg:border-0 lg:bg-transparent"
              }`}
            >
              <span className="[&_svg]:size-4">{i.icono}</span>
              {i.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
