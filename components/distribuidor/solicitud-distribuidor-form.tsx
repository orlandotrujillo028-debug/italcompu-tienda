"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CamposNegocio, VALORES_NEGOCIO } from "@/components/distribuidor/campos-negocio";
import { solicitarDistribuidor } from "@/app/(auth)/actions";
import { datosNegocioSchema, type DatosNegocioInput } from "@/lib/validaciones/auth";

/** Cliente con cuenta que solicita precios de distribuidor. */
export function SolicitudDistribuidorForm({ valores }: { valores?: Partial<DatosNegocioInput> }) {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const form = useForm<DatosNegocioInput>({
    resolver: zodResolver(datosNegocioSchema),
    defaultValues: { ...VALORES_NEGOCIO, ...valores },
  });

  const enviar = form.handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      const r = await solicitarDistribuidor(datos);
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
        <CamposNegocio />
        <Button type="submit" size="lg" className="h-10 w-full sm:w-auto" disabled={pendiente}>
          {pendiente && <Loader2 className="animate-spin" />}
          Enviar solicitud
        </Button>
      </form>
    </FormProvider>
  );
}
