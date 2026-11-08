"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { IconoCategoria } from "@/components/tienda/iconos";

type Categoria = { id: string; nombre: string; slug: string; icono: string | null };

const VISIBLES = 15;

/** Grilla de categorías con icono: muestra 15 y un botón "Ver todas (+N)". */
export function GridCategorias({ categorias }: { categorias: Categoria[] }) {
  const [todas, setTodas] = useState(false);
  const sobran = categorias.length - VISIBLES;
  const lista = todas || sobran <= 0 ? categorias : categorias.slice(0, VISIBLES);

  const tarjeta =
    "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:border-marca-cyan hover:shadow-md sm:p-4";

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {lista.map((c) => (
        <li key={c.id}>
          <Link href={`/categoria/${c.slug}`} className={`${tarjeta} h-full`}>
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-marca-azul sm:size-12">
              <IconoCategoria nombre={c.icono} className="size-5 sm:size-6" />
            </span>
            <span className="text-xs leading-tight font-medium text-marca-navy sm:text-sm">{c.nombre}</span>
          </Link>
        </li>
      ))}
      {sobran > 0 && !todas && (
        <li>
          <button type="button" onClick={() => setTodas(true)} className={`${tarjeta} h-full w-full`}>
            <span className="flex size-11 items-center justify-center rounded-full bg-marca-azul text-white sm:size-12">
              <LayoutGrid className="size-5 sm:size-6" />
            </span>
            <span className="text-xs leading-tight font-semibold text-marca-azul sm:text-sm">Ver todas (+{sobran})</span>
          </button>
        </li>
      )}
    </ul>
  );
}
