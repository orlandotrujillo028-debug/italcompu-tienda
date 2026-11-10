"use client";

import { useActionState, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { subirInventario, type EstadoSubida } from "@/app/admin/inventario/actions";
import { Button } from "@/components/ui/button";

/** Formulario para subir el Excel de inventario exportado por el sistema contable. */
export function SubirInventario() {
  const [estado, accion, pendiente] = useActionState<EstadoSubida, FormData>(subirInventario, undefined);
  const [nombre, setNombre] = useState("");

  return (
    <form action={accion} className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-semibold text-marca-navy">Subir inventario</h2>
        <p className="text-sm text-marca-gris">
          El Excel tal como lo exporta el sistema (<strong>Vista: Inventario</strong>, archivo .xls). Primero verás la
          comparación; la tienda solo cambia cuando presionas <strong>Aplicar a la tienda</strong>.
        </p>
      </div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-marca-azul/25 bg-marca-fondo/60 px-4 py-6 text-center text-sm transition hover:border-marca-azul/60">
        <FileSpreadsheet className="size-8 text-marca-azul" aria-hidden />
        <span className="font-medium text-marca-navy">{nombre || "Elige el archivo inventario.xls"}</span>
        <span className="text-xs text-marca-gris">Máximo 8 MB</span>
        <input
          type="file"
          name="archivo"
          accept=".xls,.xml,application/vnd.ms-excel"
          required
          className="sr-only"
          onChange={(e) => setNombre(e.target.files?.[0]?.name ?? "")}
        />
      </label>
      {estado?.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.error}
        </p>
      )}
      <Button type="submit" disabled={pendiente || !nombre}>
        {pendiente ? <Loader2 className="animate-spin" /> : <Upload />}
        {pendiente ? "Leyendo el inventario…" : "Subir y comparar"}
      </Button>
    </form>
  );
}
