"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { iniciarSesion } from "@/app/(auth)/actions";
import { loginSchema, type LoginInput } from "@/lib/validaciones/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const e = formState.errors;

  const enviar = handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      const r = await iniciarSesion(datos, callbackUrl);
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
      <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
      <Campo id="password" label="Contraseña" type="password" autoComplete="current-password" error={e.password?.message} {...register("password")} />
      <div className="text-right">
        <Link href="/recuperar-contrasena" className="text-sm text-marca-azul hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
        {pendiente && <Loader2 className="animate-spin" />}
        Ingresar
      </Button>
    </form>
  );
}
