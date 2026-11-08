"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fila horizontal de tarjetas con flechas (en móvil se desliza con el dedo).
 * Las tarjetas llegan como children ya renderizadas en el servidor.
 */
export function CarruselProductos({ children, etiqueta }: { children: React.ReactNode; etiqueta: string }) {
  const pista = useRef<HTMLDivElement>(null);

  const mover = (dir: 1 | -1) => {
    const el = pista.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const flecha =
    "absolute top-1/3 z-10 hidden size-10 items-center justify-center rounded-full border bg-white text-marca-navy shadow-md hover:bg-marca-azul hover:text-white md:flex";

  return (
    <div className="relative">
      <button type="button" onClick={() => mover(-1)} aria-label={`Anteriores en ${etiqueta}`} className={`${flecha} -left-4`}>
        <ChevronLeft className="size-5" />
      </button>
      <div
        ref={pista}
        role="list"
        aria-label={etiqueta}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button type="button" onClick={() => mover(1)} aria-label={`Siguientes en ${etiqueta}`} className={`${flecha} -right-4`}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

/** Contenedor de cada tarjeta dentro del carrusel (ancho fijo por tamaño de pantalla). */
export function ItemCarrusel({ children }: { children: React.ReactNode }) {
  return (
    <div role="listitem" className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[18.8%]">
      {children}
    </div>
  );
}
