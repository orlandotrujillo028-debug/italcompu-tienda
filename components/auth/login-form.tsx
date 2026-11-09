"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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
      <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" icono={Mail} error={e.email?.message} {...register("email")} />
      <Campo id="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" icono={LockKeyhole} error={e.password?.message} {...register("password")} />
      <div className="text-right">
        <Link href="/recuperar-contrasena" className="text-sm text-marca-azul hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        className="group h-11 w-full bg-gradient-to-r from-marca-azul to-[#1565c8] text-white shadow-[0_10px_30px_-10px_rgba(18,180,230,0.7)] ring-1 ring-white/15 transition-all hover:brightness-110 hover:shadow-[0_14px_36px_-10px_rgba(18,180,230,0.9)]"
        disabled={pendiente}
      >
        {pendiente ? <Loader2 className="animate-spin" /> : null}
        Ingresar
        {!pendiente && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-marca-gris">
        <ShieldCheck className="size-3.5 text-marca-azul" aria-hidden />
        Conexión cifrada y protegida
      </p>
    </form>
  );
}
