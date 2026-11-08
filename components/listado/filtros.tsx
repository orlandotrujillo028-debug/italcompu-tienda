"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { conParams } from "@/components/listado/url";
import { formatoUSD } from "@/lib/formato";

type Facetas = {
  marcas: { slug: string; nombre: string; cantidad: number }[];
  subcategorias: { slug: string; nombre: string; cantidad: number }[];
  precioMin: number | null;
  precioMax: number | null;
};

type Props = { ruta: string; consulta: Record<string, string>; facetas: Facetas; tituloSub?: string };

/** Contenido de los filtros (se usa en la barra lateral y en el panel móvil). */
function PanelFiltros({ ruta, consulta, facetas, tituloSub = "Subcategoría", alNavegar }: Props & { alNavegar?: () => void }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const marcasActivas = (consulta.marca ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(consulta.min ?? "");
  const [max, setMax] = useState(consulta.max ?? "");

  const ir = (cambios: Record<string, string | null>) => {
    alNavegar?.();
    startTransition(() => router.push(conParams(ruta, consulta, cambios), { scroll: false }));
  };

  const alternarMarca = (slug: string) => {
    const nuevas = marcasActivas.includes(slug) ? marcasActivas.filter((m) => m !== slug) : [...marcasActivas, slug];
    ir({ marca: nuevas.join(",") || null });
  };

  const hayFiltros = ["marca", "sub", "min", "max", "stock"].some((k) => consulta[k]);
  const titulo = "mb-2 text-sm font-semibold text-marca-navy";

  return (
    <div className="space-y-6">
      {hayFiltros && (
        <Link
          href={conParams(ruta, consulta, { marca: null, sub: null, min: null, max: null, stock: null })}
          onClick={alNavegar}
          scroll={false}
          className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
        >
          <X className="size-4" /> Limpiar filtros
        </Link>
      )}

      {facetas.subcategorias.length > 0 && (
        <fieldset>
          <legend className={titulo}>{tituloSub}</legend>
          <ul className="space-y-0.5">
            {facetas.subcategorias.map((s) => {
              const activa = consulta.sub === s.slug;
              return (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => ir({ sub: activa ? null : s.slug })}
                    aria-pressed={activa}
                    aria-label={`${s.nombre} (${s.cantidad})`}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${activa ? "bg-accent font-semibold text-marca-azul" : "hover:bg-muted"}`}
                  >
                    <span>{s.nombre}</span>
                    <span className="text-xs text-marca-gris">{s.cantidad}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {facetas.marcas.length > 0 && (
        <fieldset>
          <legend className={titulo}>Marca</legend>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {facetas.marcas.map((m) => {
              const activa = marcasActivas.includes(m.slug);
              return (
                <li key={m.slug}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={activa}
                    aria-label={`${m.nombre} (${m.cantidad})`}
                    onClick={() => alternarMarca(m.slug)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${activa ? "border-marca-azul bg-marca-azul text-white" : "border-input bg-white"}`}>
                      {activa && <Check className="size-3" />}
                    </span>
                    <span className="flex-1">{m.nombre}</span>
                    <span className="text-xs text-marca-gris">{m.cantidad}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className={titulo}>Precio (incluye IVA)</legend>
        {facetas.precioMin !== null && facetas.precioMax !== null && (
          <p className="mb-2 text-xs text-marca-gris">
            Desde {formatoUSD(facetas.precioMin)} hasta {formatoUSD(facetas.precioMax)}
          </p>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ir({ min: min.trim() || null, max: max.trim() || null });
          }}
        >
          <label className="sr-only" htmlFor="precio-min">
            Precio mínimo
          </label>
          <input id="precio-min" inputMode="decimal" placeholder="Mín." value={min} onChange={(e) => setMin(e.target.value)} className="h-9 w-full min-w-0 rounded-lg border border-input bg-white px-2 text-sm outline-none focus:border-ring" />
          <span className="text-marca-gris">–</span>
          <label className="sr-only" htmlFor="precio-max">
            Precio máximo
          </label>
          <input id="precio-max" inputMode="decimal" placeholder="Máx." value={max} onChange={(e) => setMax(e.target.value)} className="h-9 w-full min-w-0 rounded-lg border border-input bg-white px-2 text-sm outline-none focus:border-ring" />
          <button type="submit" className="h-9 shrink-0 rounded-lg bg-marca-azul px-3 text-sm font-medium text-white hover:bg-marca-navy">
            Ir
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className={titulo}>Disponibilidad</legend>
        <button
          type="button"
          role="checkbox"
          aria-checked={consulta.stock === "1"}
          aria-label="Solo productos en stock"
          onClick={() => ir({ stock: consulta.stock === "1" ? null : "1" })}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
        >
          <span className={`flex size-4 items-center justify-center rounded border ${consulta.stock === "1" ? "border-marca-azul bg-marca-azul text-white" : "border-input bg-white"}`}>
            {consulta.stock === "1" && <Check className="size-3" />}
          </span>
          Solo productos en stock
        </button>
      </fieldset>
    </div>
  );
}

/** Barra lateral de filtros (escritorio). */
export function FiltrosLateral(props: Props) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros">
      <div className="sticky top-40 rounded-xl border bg-card p-4">
        <PanelFiltros key={`${props.consulta.min}-${props.consulta.max}`} {...props} />
      </div>
    </aside>
  );
}

/** Botón "Filtros" que abre un panel (móvil y tablet). */
export function FiltrosMovil(props: Props) {
  const [abierto, setAbierto] = useState(false);
  const activos = ["marca", "sub", "min", "max", "stock"].filter((k) => props.consulta[k]).length;
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <button type="button" className="flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-marca-navy lg:hidden">
          <SlidersHorizontal className="size-4" />
          Filtros
          {activos > 0 && <span className="rounded-full bg-marca-azul px-1.5 text-xs text-white">{activos}</span>}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] overflow-y-auto sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle className="text-marca-navy">Filtrar productos</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <PanelFiltros key={`${props.consulta.min}-${props.consulta.max}`} {...props} alNavegar={() => setAbierto(false)} />
        </div>
        <div className="mt-auto border-t p-4">
          <SheetClose asChild>
            <button type="button" className="h-10 w-full rounded-lg bg-marca-azul font-medium text-white">
              Ver resultados
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
