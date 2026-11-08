"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { PROVINCIAS_ECUADOR, TIPOS_NEGOCIO } from "@/lib/ecuador";
import type { DatosNegocioInput } from "@/lib/validaciones/auth";

const claseSelect =
  "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

/** Campos del local (se usan dentro de un <FormProvider>). */
export function CamposNegocio() {
  const { register, formState } = useFormContext<DatosNegocioInput>();
  const e = formState.errors;

  return (
    <div className="space-y-4">
      <Campo id="nombreLocal" label="Nombre comercial del local" placeholder="Ej.: CompuRed Ambato" error={e.nombreLocal?.message} {...register("nombreLocal")} />
      <Campo id="razonSocial" label="Razón social (como en el RUC)" error={e.razonSocial?.message} {...register("razonSocial")} />
      <Campo id="ruc" label="RUC" inputMode="numeric" maxLength={13} placeholder="1790012345001" error={e.ruc?.message} {...register("ruc")} />

      <div className="space-y-1.5">
        <Label htmlFor="tipoNegocio">Tipo de negocio</Label>
        <select id="tipoNegocio" className={claseSelect} aria-invalid={!!e.tipoNegocio} defaultValue="" {...register("tipoNegocio")}>
          <option value="" disabled>
            Elige una opción
          </option>
          {TIPOS_NEGOCIO.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {e.tipoNegocio && <p className="text-sm text-destructive">{e.tipoNegocio.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="provincia">Provincia</Label>
          <select id="provincia" className={claseSelect} aria-invalid={!!e.provincia} defaultValue="" {...register("provincia")}>
            <option value="" disabled>
              Elige
            </option>
            {PROVINCIAS_ECUADOR.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          {e.provincia && <p className="text-sm text-destructive">{e.provincia.message}</p>}
        </div>
        <Campo id="ciudad" label="Ciudad" error={e.ciudad?.message} {...register("ciudad")} />
      </div>

      <Campo id="direccion" label="Dirección del local (opcional)" error={e.direccion?.message} {...register("direccion")} />
      <Campo id="telefonoLocal" label="Celular / WhatsApp del local" type="tel" placeholder="0991234567" error={e.telefonoLocal?.message} {...register("telefonoLocal")} />
    </div>
  );
}

export const VALORES_NEGOCIO: DatosNegocioInput = {
  nombreLocal: "",
  razonSocial: "",
  ruc: "",
  tipoNegocio: "" as DatosNegocioInput["tipoNegocio"],
  provincia: "" as DatosNegocioInput["provincia"],
  ciudad: "",
  direccion: "",
  telefonoLocal: "",
};
