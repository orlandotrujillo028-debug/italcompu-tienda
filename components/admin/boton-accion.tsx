"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Resultado = { ok: true } | { error: string };

/**
 * Botón que ejecuta una Server Action, muestra el resultado y refresca la página.
 * Con `confirmar`, pide un segundo clic antes de ejecutar (para acciones delicadas).
 */
export function BotonAccion({
  accion,
  exito,
  confirmar,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & { accion: () => Promise<Resultado>; exito: string; confirmar?: string }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [seguro, setSeguro] = useState(false);

  const ejecutar = () =>
    startTransition(async () => {
      const r = await accion();
      setSeguro(false);
      if ("error" in r) return void toast.error(r.error);
      toast.success(exito);
      router.refresh();
    });

  if (confirmar && seguro) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-destructive/10 px-2 py-1 text-sm text-destructive">
        {confirmar}
        <Button size="sm" variant="destructive" disabled={pendiente} onClick={ejecutar}>
          {pendiente && <Loader2 className="animate-spin" />} Sí
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSeguro(false)}>No</Button>
      </span>
    );
  }

  return (
    <Button {...props} disabled={pendiente || props.disabled} onClick={() => (confirmar ? setSeguro(true) : ejecutar())}>
      {pendiente && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** Campo de texto + botón (rechazar con motivo, etc.). */
export function AccionConTexto({
  accion,
  exito,
  boton,
  placeholder,
  etiqueta,
  tono = "peligro",
  minimo = 5,
}: {
  accion: (texto: string) => Promise<Resultado>;
  exito: string;
  boton: string;
  placeholder: string;
  etiqueta: string;
  /** "peligro" (rojo: rechazar, cancelar) o "positivo" (verde: confirmar). */
  tono?: "peligro" | "positivo";
  minimo?: number;
}) {
  const positivo = tono === "positivo";
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [pendiente, startTransition] = useTransition();

  if (!abierto) {
    return (
      <Button size="sm" variant="outline" className={positivo ? "border-emerald-600 text-emerald-700" : "text-destructive"} onClick={() => setAbierto(true)}>
        {boton}
      </Button>
    );
  }
  return (
    <span className={`flex w-full flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center ${positivo ? "border-emerald-600/30 bg-emerald-50" : "border-destructive/30 bg-destructive/5"}`}>
      <label className="sr-only" htmlFor={`texto-${etiqueta}`}>{etiqueta}</label>
      <input
        id={`texto-${etiqueta}`}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        maxLength={300}
        className="h-8 min-w-0 flex-1 rounded-md border border-input bg-white px-2 text-sm outline-none focus:border-ring"
      />
      <span className="flex gap-1.5">
        <Button
          size="sm"
          variant={positivo ? "default" : "destructive"}
          className={positivo ? "bg-emerald-600 hover:bg-emerald-700" : undefined}
          disabled={pendiente || texto.trim().length < minimo}
          onClick={() =>
            startTransition(async () => {
              const r = await accion(texto);
              if ("error" in r) return void toast.error(r.error);
              toast.success(exito);
              setAbierto(false);
              setTexto("");
              router.refresh();
            })
          }
        >
          {pendiente && <Loader2 className="animate-spin" />} {boton}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </span>
    </span>
  );
}
