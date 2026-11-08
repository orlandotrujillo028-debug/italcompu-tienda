"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerHome } from "@/lib/catalogo";

const INTERVALO = 6000;

/** Carrusel de banners del inicio: cambia solo cada 6 s, se pausa al pasar el mouse. */
export function CarruselBanners({ banners }: { banners: BannerHome[] }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = banners.length;

  const ir = useCallback((i: number) => setActual(((i % total) + total) % total), [total]);

  useEffect(() => {
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (total < 2 || pausado || sinMovimiento) return;
    const t = setInterval(() => setActual((a) => (a + 1) % total), INTERVALO);
    return () => clearInterval(t);
  }, [total, pausado]);

  if (total === 0) return null;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones"
      className="relative overflow-hidden rounded-2xl shadow-md"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${actual * 100}%)` }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={i !== actual}
            className="relative aspect-[16/9] w-full shrink-0 sm:aspect-[16/6] lg:aspect-[16/5]"
          >
            <Image
              src={b.imagen}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              unoptimized={b.imagen.endsWith(".svg")}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-marca-navy/85 via-marca-navy/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 text-white sm:gap-3 sm:p-10 lg:p-14">
              <h2 className="max-w-[16ch] text-2xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">{b.titulo}</h2>
              {b.subtitulo && <p className="max-w-md text-sm text-white/90 sm:text-lg">{b.subtitulo}</p>}
              {b.enlace && (
                <Link
                  href={b.enlace}
                  tabIndex={i === actual ? 0 : -1}
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-marca-navy shadow hover:bg-marca-cyan hover:text-white sm:mt-3"
                >
                  Ver más
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(actual - 1)}
            aria-label="Banner anterior"
            className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-marca-navy shadow hover:bg-white sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => ir(actual + 1)}
            aria-label="Banner siguiente"
            className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-marca-navy shadow hover:bg-white sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir al banner ${i + 1}`}
                aria-current={i === actual}
                className={`h-2 rounded-full transition-all ${i === actual ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
