"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { guardarDireccion } from "@/app/(tienda)/checkout/actions";
import { actualizarDireccion } from "@/app/cuenta/actions";
import { CIUDADES_POR_PROVINCIA, PROVINCIAS_ECUADOR } from "@/lib/ecuador";
import { direccionSchema, type DireccionInput } from "@/lib/validaciones/pedido";

type Props = {
  alGuardar: (id: string) => void;
  alCancelar?: () => void;
  nombreInicial?: string;
  /** Si llega, el formulario EDITA esa dirección en lugar de crear una nueva. */
  editar?: { id: string; valores: DireccionInput };
};

/** Formulario de dirección: crear (checkout, "Mis direcciones") o editar. */
export function DireccionForm({ alGuardar, alCancelar, nombreInicial = "", editar }: Props) {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState, watch } = useForm<DireccionInput>({
    resolver: zodResolver(direccionSchema),
    defaultValues: editar?.valores ?? {
      nombre: nombreInicial,
      telefono: "",
      provincia: "" as DireccionInput["provincia"],
      ciudad: "",
      direccion: "",
      referencia: "",
      principal: false,
    },
  });
  const e = formState.errors;
  const provincia = watch("provincia");
  const ciudades = provincia ? (CIUDADES_POR_PROVINCIA[provincia] ?? []) : [];

  const enviar = handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      if (editar) {
        const r = await actualizarDireccion(editar.id, datos);
        if ("error" in r) setError(r.error);
        else alGuardar(editar.id);
      } else {
        const r = await guardarDireccion(datos);
        if ("error" in r) setError(r.error);
        else alGuardar(r.id);
      }
    });
  });

  const claseSelect = "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-marca-azul/40 bg-marca-fondo p-4">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="d-nombre" label="Quién recibe" autoComplete="name" error={e.nombre?.message} {...register("nombre")} />
        <Campo id="d-telefono" label="Celular de contacto" type="tel" autoComplete="tel" placeholder="0991234567" error={e.telefono?.message} {...register("telefono")} />
        <div className="space-y-1.5">
          <Label htmlFor="d-provincia">Provincia</Label>
          <select id="d-provincia" className={claseSelect} aria-invalid={!!e.provincia} {...register("provincia")}>
            <option value="" disabled>Elige</option>
            {PROVINCIAS_ECUADOR.map((p) => <option key={p}>{p}</option>)}
          </select>
          {e.provincia && <p className="text-sm text-destructive">{e.provincia.message}</p>}
        </div>
        <div>
          <Campo id="d-ciudad" label="Ciudad / cantón" list="d-ciudades" autoComplete="address-level2" error={e.ciudad?.message} {...register("ciudad")} />
          <datalist id="d-ciudades">{ciudades.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      <Campo id="d-direccion" label="Dirección" placeholder="Av. Principal N12-34 y Calle Secundaria" autoComplete="street-address" error={e.direccion?.message} {...register("direccion")} />
      <Campo id="d-referencia" label="Referencia (opcional)" placeholder="Casa esquinera, portón azul…" error={e.referencia?.message} {...register("referencia")} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-marca-azul" {...register("principal")} />
        Usar como dirección principal
      </label>
      <div className="flex gap-2">
        <Button type="button" onClick={enviar} disabled={pendiente}>
          {pendiente && <Loader2 className="animate-spin" />}
          Guardar dirección
        </Button>
        {alCancelar && (
          <Button type="button" variant="ghost" onClick={alCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
