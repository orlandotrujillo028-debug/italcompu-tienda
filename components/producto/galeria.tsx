"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

/** Galería del detalle: imagen grande + miniaturas. */
export function Galeria({ imagenes, nombre, agotado }: { imagenes: string[]; nombre: string; agotado: boolean }) {
  const [actual, setActual] = useState(0);
  const src = imagenes[actual];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-white">
        {src ? (
          <Image
            src={src}
            alt={nombre}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-contain p-6"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-marca-gris">
            <ImageOff className="size-16" />
          </span>
        )}
        {agotado && <span className="absolute top-3 left-3 rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Consultar disponibilidad</span>}
      </div>

      {imagenes.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Más imágenes">
          {imagenes.map((url, i) => (
            <li key={url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
                aria-current={i === actual}
                className={`relative block size-16 overflow-hidden rounded-lg border-2 bg-white sm:size-20 ${i === actual ? "border-marca-azul" : "border-transparent hover:border-marca-cyan"}`}
              >
                <Image src={url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
