"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, Search } from "lucide-react";
import { formatoUSD } from "@/lib/formato";

type Sugerencias = {
  productos: { slug: string; nombre: string; codigo: string; marca: string | null; imagen: string | null; precio: number; agotado: boolean }[];
  categorias: { slug: string; nombre: string }[];
  esDistribuidor: boolean;
};

const VACIO: Sugerencias = { productos: [], categorias: [], esDistribuidor: false };

/** Buscador del header con sugerencias mientras escribes (productos y categorías). */
export function Buscador({ className = "" }: { className?: string }) {
  const router = useRouter();
  const idLista = useId();
  const [q, setQ] = useState("");
  const [datos, setDatos] = useState<Sugerencias>(VACIO);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const caja = useRef<HTMLDivElement>(null);

  // Opciones navegables con el teclado: categorías primero, luego productos.
  const opciones = [
    ...datos.categorias.map((c) => ({ key: `c-${c.slug}`, href: `/categoria/${c.slug}` })),
    ...datos.productos.map((p) => ({ key: `p-${p.slug}`, href: `/producto/${p.slug}` })),
  ];

  // Pide sugerencias 250 ms después de dejar de escribir.
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) return;
    const control = new AbortController();
    const t = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`, { signal: control.signal });
        if (r.ok) {
          setDatos(await r.json());
          setActivo(-1);
        }
      } catch {
        /* búsqueda cancelada o sin conexión: se ignora */
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [q]);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const ir = (href: string) => {
    setAbierto(false);
    router.push(href);
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = q.trim();
    if (activo >= 0 && opciones[activo]) return ir(opciones[activo].href);
    if (texto) ir(`/buscar?q=${encodeURIComponent(texto)}`);
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => Math.min(a + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((a) => Math.max(a - 1, -1));
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  const textoValido = q.trim().length >= 2;
  const mostrar = abierto && textoValido;
  const hayResultados = opciones.length > 0;

  return (
    <div ref={caja} className={`relative ${className}`}>
      <form onSubmit={buscar} role="search">
        <label htmlFor={`${idLista}-q`} className="sr-only">
          Buscar productos
        </label>
        <input
          id={`${idLista}-q`}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
            if (e.target.value.trim().length < 2) setDatos(VACIO);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={teclas}
          placeholder="Busca por producto, código o marca…"
          autoComplete="off"
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={idLista}
          aria-activedescendant={activo >= 0 ? `${idLista}-${activo}` : undefined}
          className="h-11 w-full rounded-full border-2 border-marca-azul/25 bg-white pr-12 pl-5 text-sm outline-none placeholder:text-marca-gris focus:border-marca-cyan"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-marca-azul text-white hover:bg-marca-navy"
        >
          {cargando ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </form>

      {mostrar && (
        <div
          id={idLista}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border bg-white p-2 shadow-xl"
        >
          {!hayResultados && !cargando && (
            <p className="px-3 py-4 text-center text-sm text-marca-gris">No encontramos coincidencias para “{q.trim()}”.</p>
          )}

          {datos.categorias.map((c, i) => (
            <button
              key={c.slug}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={activo === i}
              onMouseEnter={() => setActivo(i)}
              onClick={() => ir(`/categoria/${c.slug}`)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-marca-navy aria-selected:bg-accent"
            >
              <FolderOpen className="size-4 text-marca-cyan" />
              {c.nombre}
            </button>
          ))}

          {datos.productos.map((p, j) => {
            const i = datos.categorias.length + j;
            return (
              <button
                key={p.slug}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={activo === i}
                onMouseEnter={() => setActivo(i)}
                onClick={() => ir(`/producto/${p.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left aria-selected:bg-accent"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-marca-fondo">
                  {p.imagen && <Image src={p.imagen} alt="" fill sizes="48px" className="object-contain" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium text-foreground">{p.nombre}</span>
                  <span className="text-xs text-marca-gris">
                    Código: {p.codigo}
                    {p.marca && ` · ${p.marca}`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold text-marca-azul">{formatoUSD(p.precio)}</span>
                  {p.agotado && <span className="text-xs text-amber-800">Consultar stock</span>}
                </span>
              </button>
            );
          })}

          {hayResultados && (
            <button
              onClick={() => ir(`/buscar?q=${encodeURIComponent(q.trim())}`)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-marca-azul hover:bg-accent"
            >
              Ver todos los resultados de “{q.trim()}”
              {datos.esDistribuidor && <span className="ml-1 text-xs text-marca-gris">(precios de distribuidor)</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
