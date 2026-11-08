"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LayoutGrid, Sparkles, Tags } from "lucide-react";
import { IconoCategoria } from "@/components/tienda/iconos";
import type { CategoriaMenu } from "@/lib/catalogo";

/**
 * Barra de categorías (escritorio): botón "Categorías" con mega-menú
 * (lista a la izquierda, subcategorías a la derecha) + accesos rápidos.
 */
export function MenuCategorias({ categorias }: { categorias: CategoriaMenu[] }) {
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abiertoEn = useRef(0);

  // Cerrar con Escape o clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    const clic = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("mousedown", clic);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("mousedown", clic);
    };
  }, [abierto]);

  // Pequeña pausa al salir con el mouse para que no se cierre por accidente.
  const entrar = () => {
    clearTimeout(temporizador.current);
    if (!abierto) abiertoEn.current = Date.now();
    setAbierto(true);
  };
  // Al pasar el mouse ya se abre; un clic inmediato no debe cerrarlo (solo alterna si pasó un momento).
  const alternar = () => {
    if (Date.now() - abiertoEn.current < 500) return setAbierto(true);
    abiertoEn.current = Date.now();
    setAbierto((a) => !a);
  };
  const salir = () => {
    temporizador.current = setTimeout(() => setAbierto(false), 150);
  };
  const cerrar = () => setAbierto(false);

  const actual = categorias[activa];
  const rapidas = categorias.slice(0, 7);

  return (
    <div className="hidden bg-gradient-to-r from-marca-navy to-marca-azul text-white lg:block">
      <div ref={contenedor} className="relative mx-auto flex h-11 max-w-7xl items-center px-4" onMouseLeave={salir}>
        <button
          type="button"
          onMouseEnter={entrar}
          onClick={alternar}
          aria-expanded={abierto}
          aria-haspopup="true"
          className={`flex h-full items-center gap-2 px-4 text-sm font-semibold transition-colors ${abierto ? "bg-white text-marca-navy" : "hover:bg-white/10"}`}
        >
          <LayoutGrid className="size-4" />
          Categorías
          <ChevronDown className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
        </button>

        <nav className="flex h-full flex-1 items-center overflow-hidden" aria-label="Categorías principales">
          {rapidas.map((c, i) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className={`h-full items-center px-3 text-sm whitespace-nowrap hover:bg-white/10 ${i < 5 ? "flex" : "hidden xl:flex"}`}
            >
              {c.nombre}
            </Link>
          ))}
        </nav>

        <div className="flex h-full items-center">
          <Link href="/marcas" className="flex h-full items-center gap-1.5 px-3 text-sm whitespace-nowrap hover:bg-white/10">
            <Tags className="size-4 text-marca-cyan" />
            Stock por marca
          </Link>
          <Link href="/nuevos" className="flex h-full items-center gap-1.5 px-3 text-sm whitespace-nowrap hover:bg-white/10">
            <Sparkles className="size-4 text-marca-cyan" />
            Nuevos productos
          </Link>
        </div>

        {abierto && actual && (
          <div
            onMouseEnter={entrar}
            className="absolute top-full left-4 z-50 flex w-[min(56rem,calc(100%-2rem))] overflow-hidden rounded-b-xl border border-t-0 bg-white text-foreground shadow-2xl"
          >
            <ul className="max-h-[70vh] w-64 shrink-0 overflow-y-auto border-r bg-marca-fondo py-2">
              {categorias.map((c, i) => (
                <li key={c.id}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    onMouseEnter={() => setActiva(i)}
                    onFocus={() => setActiva(i)}
                    onClick={cerrar}
                    className={`flex items-center gap-3 px-4 py-2 text-sm ${i === activa ? "bg-white font-semibold text-marca-azul" : "text-marca-navy hover:bg-white"}`}
                  >
                    <IconoCategoria nombre={c.icono} className="size-4 shrink-0" />
                    <span className="flex-1">{c.nombre}</span>
                    <ChevronRight className="size-3.5 opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex-1 p-6">
              <div className="mb-4 flex items-center gap-3 border-b pb-3">
                <IconoCategoria nombre={actual.icono} className="size-6 text-marca-cyan" />
                <h3 className="text-lg font-bold text-marca-navy">{actual.nombre}</h3>
              </div>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 xl:grid-cols-3">
                {actual.children.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/categoria/${s.slug}`}
                      onClick={cerrar}
                      className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-marca-azul"
                    >
                      {s.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/categoria/${actual.slug}`}
                onClick={cerrar}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-marca-azul hover:underline"
              >
                Ver todo en {actual.nombre}
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
