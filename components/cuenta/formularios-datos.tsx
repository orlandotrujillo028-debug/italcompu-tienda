"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { actualizarDatos, cambiarContrasena } from "@/app/cuenta/actions";
import { cambiarClaveSchema, datosPersonalesSchema, type CambiarClaveInput, type DatosPersonalesInput } from "@/lib/validaciones/cuenta";

export function FormDatos({ email, valores }: { email: string; valores: DatosPersonalesInput }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState, reset } = useForm<DatosPersonalesInput>({
    resolver: zodResolver(datosPersonalesSchema),
    defaultValues: valores,
  });
  const e = formState.errors;

  const enviar = handleSubmit((datos) =>
    startTransition(async () => {
      const r = await actualizarDatos(datos);
      if ("error" in r) return void toast.error(r.error);
      toast.success(r.mensaje ?? "Guardado");
      reset(datos); // el formulario queda "sin cambios"
      router.refresh();
    }),
  );

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Correo electrónico</p>
        <p className="rounded-lg border bg-muted px-3 py-2 text-sm text-marca-gris">{email}</p>
        <p className="text-xs text-marca-gris">Para cambiar tu correo escríbenos por WhatsApp.</p>
      </div>
      <Campo id="nombre" label="Nombre completo" autoComplete="name" error={e.nombre?.message} {...register("nombre")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="telefono" label="Celular" type="tel" autoComplete="tel" placeholder="0991234567" error={e.telefono?.message} {...register("telefono")} />
        <Campo id="cedula" label="Cédula o RUC (para tu factura)" inputMode="numeric" maxLength={13} error={e.cedula?.message} {...register("cedula")} />
      </div>
      <Button type="submit" disabled={pendiente || !formState.isDirty}>
        {pendiente ? <Loader2 className="animate-spin" /> : <Save />}
        Guardar cambios
      </Button>
    </form>
  );
}

export function FormClave() {
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState, reset, setError } = useForm<CambiarClaveInput>({
    resolver: zodResolver(cambiarClaveSchema),
    defaultValues: { actual: "", nueva: "", confirmar: "" },
  });
  const e = formState.errors;

  const enviar = handleSubmit((datos) =>
    startTransition(async () => {
      const r = await cambiarContrasena(datos);
      if ("error" in r) {
        if (r.error.includes("actual")) setError("actual", { message: r.error });
        else toast.error(r.error);
        return;
      }
      toast.success(r.mensaje ?? "Contraseña actualizada");
      reset();
    }),
  );

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo id="actual" label="Contraseña actual" type="password" autoComplete="current-password" error={e.actual?.message} {...register("actual")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nueva" label="Nueva contraseña" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres, con letras y números." error={e.nueva?.message} {...register("nueva")} />
        <Campo id="confirmar" label="Repite la nueva" type="password" autoComplete="new-password" error={e.confirmar?.message} {...register("confirmar")} />
      </div>
      <Button type="submit" variant="secondary" disabled={pendiente}>
        {pendiente ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Cambiar contraseña
      </Button>
    </form>
  );
}
