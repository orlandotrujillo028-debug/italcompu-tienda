"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { registrarVendedor } from "@/app/(auth)/actions";
import { registroVendedorSchema, type RegistroVendedorInput } from "@/lib/validaciones/auth";

export function RegistroVendedorForm() {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<RegistroVendedorInput>({
    resolver: zodResolver(registroVendedorSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      nombreTienda: "",
      ruc: "",
      descripcion: "",
      password: "",
      confirmar: "",
    },
  });
  const e = formState.errors;

  const enviar = handleSubmit((datos) => {
    setError(undefined);
    startTransition(async () => {
      const r = await registrarVendedor(datos);
      if (r?.error) setError(r.error);
    });
  });

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-marca-navy">Datos de tu tienda</legend>
        <Campo id="nombreTienda" label="Nombre de la tienda" error={e.nombreTienda?.message} {...register("nombreTienda")} />
        <Campo id="ruc" label="RUC (opcional)" inputMode="numeric" placeholder="1790012345001" error={e.ruc?.message} {...register("ruc")} />
        <div className="space-y-1.5">
          <Label htmlFor="descripcion">¿Qué vendes? (opcional)</Label>
          <textarea
            id="descripcion"
            rows={3}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Ej.: laptops y accesorios gamer"
            {...register("descripcion")}
          />
          {e.descripcion && <p className="text-sm text-destructive">{e.descripcion.message}</p>}
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t pt-4">
        <legend className="mb-2 text-sm font-semibold text-marca-navy">Tus datos de acceso</legend>
        <Campo id="nombre" label="Nombre del responsable" autoComplete="name" error={e.nombre?.message} {...register("nombre")} />
        <Campo id="email" label="Correo electrónico" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
        <Campo id="telefono" label="Celular" type="tel" autoComplete="tel" placeholder="0991234567" error={e.telefono?.message} {...register("telefono")} />
        <Campo id="password" label="Contraseña" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres, con letras y números." error={e.password?.message} {...register("password")} />
        <Campo id="confirmar" label="Repite la contraseña" type="password" autoComplete="new-password" error={e.confirmar?.message} {...register("confirmar")} />
      </fieldset>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
        {pendiente && <Loader2 className="animate-spin" />}
        Enviar solicitud
      </Button>
    </form>
  );
}
