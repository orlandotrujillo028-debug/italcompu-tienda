"use client";

import Link from "next/link";
import { BadgePercent, ChevronDown, Info, Menu, Sparkles, Tags } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { IconoCategoria } from "@/components/tienda/iconos";
import type { CategoriaMenu } from "@/lib/catalogo";

/** Menú lateral para celulares y tablets (categorías desplegables). */
export function MenuMovil({ categorias, esDistribuidor }: { categorias: CategoriaMenu[]; esDistribuidor: boolean }) {
  const enlace = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-marca-navy hover:bg-accent";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg text-marca-navy hover:bg-muted lg:hidden"
          aria-label="Abrir menú de categorías"
        >
          <Menu className="size-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] gap-0 overflow-y-auto p-0 sm:max-w-sm [&_[data-slot=sheet-close]]:text-white [&_[data-slot=sheet-close]]:hover:bg-white/15"
      >
        <SheetHeader className="bg-gradient-to-r from-marca-navy to-marca-azul px-4 py-4 text-white">
          <SheetTitle className="text-white">Categorías</SheetTitle>
        </SheetHeader>

        <nav className="p-2" aria-label="Categorías">
          {categorias.map((c) => (
            <details key={c.id} className="group">
              <summary className={`${enlace} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                <IconoCategoria nombre={c.icono} className="size-4 text-marca-azul" />
                <span className="flex-1 font-medium">{c.nombre}</span>
                <ChevronDown className="size-4 text-marca-gris transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mb-1 ml-9 border-l pl-2">
                <li>
                  <SheetClose asChild>
                    <Link href={`/categoria/${c.slug}`} className="block rounded-md px-3 py-2 text-sm font-semibold text-marca-azul hover:bg-accent">
                      Ver todo
                    </Link>
                  </SheetClose>
                </li>
                {c.children.map((s) => (
                  <li key={s.id}>
                    <SheetClose asChild>
                      <Link href={`/categoria/${s.slug}`} className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent">
                        {s.nombre}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t p-2">
          <SheetClose asChild>
            <Link href="/marcas" className={enlace}>
              <Tags className="size-4 text-marca-cyan" /> Stock por marca
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/nuevos" className={enlace}>
              <Sparkles className="size-4 text-marca-cyan" /> Nuevos productos
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/quienes-somos" className={enlace}>
              <Info className="size-4 text-marca-cyan" /> ¿Quiénes somos?
            </Link>
          </SheetClose>
          {!esDistribuidor && (
            <SheetClose asChild>
              <Link href="/registro-distribuidor" className={enlace}>
                <BadgePercent className="size-4 text-marca-cyan" /> ¿Tienes un local? Sé distribuidor
              </Link>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
