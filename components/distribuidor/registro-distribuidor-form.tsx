"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { CamposNegocio, VALORES_NEGOCIO } from "@/components/distribuidor/campos-negocio";
import { registrarDistribuidor } from "@/app/(auth)/actions";
import { registroDistribuidorSchema, type RegistroDistribuidorInput } from "@/lib/validaciones/auth";

/** Registro nuevo de distribuidor: datos del local + cuenta de acceso. */
export function RegistroDistribuidorForm() {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const form = useForm<RegistroDistribuidorInput>({
    resolver: zodResolver(registroDistribuidorSchema),
    defaultValues: { ...VALORES_NEGOCIO, nombre: "", email: "", password: "", confirmar: "" },
  });
  const { register, handleSubmit, formState } = form;
  const e = formState.errors;

  const enviar = handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      const r = await registrarDistribuidor(datos);
      if (r?.error) setError(r.error);
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={enviar} className="space-y-5" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-2 text-sm font-semibold text-marca-navy">Datos de tu local</legend>
          <CamposNegocio />
        </fieldset>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="mb-2 text-sm font-semibold text-marca-navy">Tus datos de acceso</legend>
          <Campo id="nombre" label="Nombre del responsable" autoComplete="name" error={e.nombre?.message} {...register("nombre")} />
          <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
          <Campo id="password" label="Contraseña" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres, con letras y números." error={e.password?.message} {...register("password")} />
          <Campo id="confirmar" label="Repite la contraseña" type="password" autoComplete="new-password" error={e.confirmar?.message} {...register("confirmar")} />
        </fieldset>

        <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
          {pendiente && <Loader2 className="animate-spin" />}
          Enviar solicitud
        </Button>
      </form>
    </FormProvider>
  );
}
