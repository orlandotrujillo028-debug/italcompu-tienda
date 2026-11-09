import { Loader2 } from "lucide-react";

/** Esqueleto mientras carga una página de la tienda (el header y el footer ya se ven). */
export function CargandoTienda() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

/** Indicador de carga para los paneles (cuenta, ventas, admin). */
export function CargandoPanel() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-marca-gris" aria-busy="true" aria-live="polite">
      <Loader2 className="size-5 animate-spin text-marca-azul" /> Cargando…
    </div>
  );
}
