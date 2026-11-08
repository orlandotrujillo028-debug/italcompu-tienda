"use client";

import { useRouter } from "next/navigation";
import { conParams } from "@/components/listado/url";

const OPCIONES = [
  ["relevancia", "Relevancia"],
  ["precio-asc", "Menor precio"],
  ["precio-desc", "Mayor precio"],
  ["nuevos", "Más nuevos"],
] as const;

/** Selector de orden (cambia ?orden= en la URL). */
export function Ordenar({ ruta, consulta }: { ruta: string; consulta: Record<string, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-marca-gris">
      <span className="hidden sm:inline">Ordenar por</span>
      <select
        value={consulta.orden ?? "relevancia"}
        onChange={(e) => router.push(conParams(ruta, consulta, { orden: e.target.value === "relevancia" ? null : e.target.value }), { scroll: false })}
        className="h-9 rounded-lg border border-input bg-white px-2 text-sm text-marca-navy outline-none focus:border-ring"
        aria-label="Ordenar productos"
      >
        {OPCIONES.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
