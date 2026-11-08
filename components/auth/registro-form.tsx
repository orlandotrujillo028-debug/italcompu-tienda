"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { registrarCliente } from "@/app/(auth)/actions";
import { registroClienteSchema, type RegistroClienteInput } from "@/lib/validaciones/auth";

export function RegistroForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<RegistroClienteInput>({
    resolver: zodResolver(registroClienteSchema),
    defaultValues: { nombre: "", email: "", telefono: "", password: "", confirmar: "" },
  });
  const e = formState.errors;

  const enviar = handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      const r = await registrarCliente(datos, callbackUrl);
      if (r?.error) setError(r.error);
    });
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Campo id="nombre" label="Nombre completo" autoComplete="name" error={e.nombre?.message} {...register("nombre")} />
      <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
      <Campo id="telefono" label="Celular (opcional)" type="tel" autoComplete="tel" placeholder="0991234567" error={e.telefono?.message} {...register("telefono")} />
      <Campo id="password" label="Contraseña" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres, con letras y números." error={e.password?.message} {...register("password")} />
      <Campo id="confirmar" label="Repite la contraseña" type="password" autoComplete="new-password" error={e.confirmar?.message} {...register("confirmar")} />
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
        {pendiente && <Loader2 className="animate-spin" />}
        Crear mi cuenta
      </Button>
    </form>
  );
}
