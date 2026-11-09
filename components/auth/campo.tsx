"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  ayuda?: string;
  /** Icono opcional dentro del campo, a la izquierda. */
  icono?: LucideIcon;
};

/** Etiqueta + campo + mensaje de error, con accesibilidad incluida. */
export function Campo({ label, error, ayuda, icono: Icono, id, type, className, ...props }: CampoProps) {
  const [ver, setVer] = useState(false);
  const esClave = type === "password";
  const idError = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="group relative">
        {Icono && (
          <Icono
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#0a6db3]"
          />
        )}
        <Input
          id={id}
          type={esClave && ver ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? idError : undefined}
          className={`h-10 bg-white ${Icono ? "pl-9" : ""} ${esClave ? "pr-10" : ""} ${className ?? ""}`}
          {...props}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-[#0a6db3]"
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={idError} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-marca-gris">{ayuda}</p>
      )}
    </div>
  );
}
