"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff, Loader2, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Resumen } from "@/components/carrito/resumen";
import { useCotizacion } from "@/components/carrito/use-cotizacion";
import { useCarrito } from "@/lib/carrito-store";
import { formatoUSD } from "@/lib/formato";

export function Carrito() {
  const { items, cotizacion, error, cargando } = useCotizacion();
  const cambiarCantidad = useCarrito((s) => s.cambiarCantidad);
  const quitar = useCarrito((s) => s.quitar);
  const vaciar = useCarrito((s) => s.vaciar);

  if (cargando && !cotizacion) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-card py-20 text-marca-gris">
        <Loader2 className="size-5 animate-spin" /> Cargando tu carrito…
      </div>
    );
  }

  if (items.length === 0 || !cotizacion || cotizacion.lineas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-marca-azul">
          <ShoppingCart className="size-8" />
        </span>
        <div>
          <p className="text-lg font-semibold text-marca-navy">Tu carrito está vacío</p>
          <p className="text-sm text-marca-gris">Explora el catálogo y agrega lo que necesitas.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/">Ir a la tienda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <section aria-label="Productos del carrito" className="space-y-3">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <ul className="divide-y rounded-xl border bg-card">
          {cotizacion.lineas.map((l) => (
            <li key={l.productId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/producto/${l.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white sm:size-24">
                {l.imagen ? <Image src={l.imagen} alt="" fill sizes="96px" className="object-contain p-1.5" /> : <ImageOff className="m-auto size-8 text-marca-gris" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/producto/${l.slug}`} className="line-clamp-2 text-sm font-medium hover:text-marca-azul">
                      {l.nombre}
                    </Link>
                    <p className="text-xs text-marca-gris">
                      Código: {l.codigo} · {formatoUSD(l.unitarioConIva)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(l.productId)}
                    aria-label={`Quitar ${l.nombre}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-marca-gris hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-2">
                  <div>
                    <div className="flex items-center rounded-lg border bg-white">
                      <button type="button" onClick={() => cambiarCantidad(l.productId, l.cantidad - 1)} aria-label="Quitar uno" className="flex size-8 items-center justify-center disabled:opacity-40" disabled={l.cantidad <= 1}>
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold" aria-live="polite">
                        {l.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.productId, l.cantidad + 1)}
                        aria-label="Agregar uno"
                        className="flex size-8 items-center justify-center disabled:opacity-40"
                        disabled={l.cantidad >= Math.min(l.stock, 99)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    {l.stock <= 5 && <p className="mt-1 text-[11px] text-amber-700">Quedan {l.stock}</p>}
                  </div>
                  <p className="text-base font-bold text-marca-azul">{formatoUSD(l.totalLinea)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-marca-azul hover:underline">
            ← Seguir comprando
          </Link>
          <button type="button" onClick={vaciar} className="text-sm text-marca-gris hover:text-destructive">
            Vaciar carrito
          </button>
        </div>
      </section>

      <div className="lg:sticky lg:top-40">
        <Resumen c={cotizacion}>
          <Button asChild size="lg" className="h-11 w-full">
            <Link href="/checkout">
              Continuar con la compra
              <ArrowRight />
            </Link>
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-marca-gris">
            <ShieldCheck className="size-3.5" /> El total final se confirma en el siguiente paso.
          </p>
        </Resumen>
      </div>
    </div>
  );
}
