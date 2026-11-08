"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  ayuda?: string;
};

/** Etiqueta + campo + mensaje de error, con accesibilidad incluida. */
export function Campo({ label, error, ayuda, id, type, className, ...props }: CampoProps) {
  const [ver, setVer] = useState(false);
  const esClave = type === "password";
  const idError = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={esClave && ver ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? idError : undefined}
          className={`h-10 bg-white ${esClave ? "pr-10" : ""} ${className ?? ""}`}
          {...props}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-marca-gris hover:text-marca-azul"
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
