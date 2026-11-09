"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { solicitarRecuperacion } from "@/app/(auth)/actions";
import { recuperarSchema, type RecuperarInput } from "@/lib/validaciones/auth";

export function RecuperarForm() {
  const [mensaje, setMensaje] = useState<{ ok?: string; error?: string }>({});
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<RecuperarInput>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: "" },
  });

  const enviar = handleSubmit((datos) => {
    startTransition(async () => setMensaje(await solicitarRecuperacion(datos)));
  });

  if (mensaje.ok) {
    return (
      <p role="status" className="flex gap-2 rounded-lg bg-accent px-3 py-3 text-sm text-accent-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-marca-cyan" />
        {mensaje.ok}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {mensaje.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mensaje.error}
        </p>
      )}
      <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" icono={Mail} error={formState.errors.email?.message} {...register("email")} />
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
        {pendiente && <Loader2 className="animate-spin" />}
        Enviar enlace
      </Button>
    </form>
  );
}
