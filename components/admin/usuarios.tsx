"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { cambiarRol, crearPersonal, restablecerClave } from "@/app/admin/usuarios/actions";

/** Selector de rol que guarda al cambiar. */
export function SelectorRol({ userId, rol, deshabilitado }: { userId: string; rol: string; deshabilitado?: boolean }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  return (
    <select
      aria-label="Rol"
      defaultValue={rol}
      disabled={deshabilitado || pendiente}
      onChange={(e) => {
        const nuevo = e.target.value;
        startTransition(async () => {
          const r = await cambiarRol(userId, nuevo);
          if ("error" in r) {
            toast.error(r.error);
            e.target.value = rol;
          } else toast.success("Rol actualizado");
          router.refresh();
        });
      }}
      className="h-8 rounded-md border border-input bg-white px-2 text-sm disabled:opacity-60"
    >
      <option value="CLIENTE">Cliente</option>
      <option value="VENDEDOR">Vendedor (personal)</option>
      <option value="ADMIN">Administrador</option>
    </select>
  );
}

/** Formulario para crear una cuenta del personal de ventas. */
export function NuevoPersonal() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState({ nombre: "", email: "", password: "" });
  const [pendiente, startTransition] = useTransition();

  if (!abierto) {
    return (
      <Button onClick={() => setAbierto(true)}>
        <UserPlus /> Crear cuenta de personal
      </Button>
    );
  }
  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await crearPersonal(datos);
          if ("error" in r) return void toast.error(r.error);
          toast.success("Cuenta creada. Comparte la contraseña temporal con la persona y pídele que la cambie en “Mis datos”.");
          setDatos({ nombre: "", email: "", password: "" });
          setAbierto(false);
          router.refresh();
        });
      }}
    >
      <p className="font-semibold text-marca-navy">Nueva cuenta de personal (rol Vendedor)</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo id="p-nombre" label="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
        <Campo id="p-email" label="Correo" type="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} />
        <Campo id="p-password" label="Contraseña temporal" type="password" autoComplete="new-password" ayuda="Mín. 8, con letras y números" value={datos.password} onChange={(e) => setDatos({ ...datos, password: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>{pendiente && <Loader2 className="animate-spin" />} Crear</Button>
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </form>
  );
}

/**
 * "Nueva contraseña": genera una contraseña temporal y la muestra UNA sola vez para pasársela
 * al cliente por WhatsApp. Luego él la cambia en Mi cuenta → Mis datos.
 */
export function BotonRestablecerClave({ userId, email }: { userId: string; email: string }) {
  const [pendiente, startTransition] = useTransition();
  const [seguro, setSeguro] = useState(false);
  const [clave, setClave] = useState<string | null>(null);

  if (clave) {
    return (
      <div role="status" className="space-y-1 rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-900">
        <p>
          Nueva contraseña de <strong>{email}</strong>:
        </p>
        <p className="flex items-center gap-2">
          <code className="rounded bg-white px-2 py-1 text-sm font-bold tracking-wide select-all">{clave}</code>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => navigator.clipboard?.writeText(clave).then(() => toast.success("Copiada"), () => toast.error("Cópiala a mano"))}
          >
            <Copy className="size-3.5" /> Copiar
          </Button>
        </p>
        <p>Pásasela por WhatsApp y pídele que la cambie en Mi cuenta → Mis datos. No se vuelve a mostrar.</p>
        <button type="button" className="text-emerald-800 underline" onClick={() => setClave(null)}>
          Listo
        </button>
      </div>
    );
  }

  if (seguro) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900">
        ¿Crear una contraseña nueva? La actual deja de funcionar.
        <Button
          size="sm"
          className="h-7"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              const r = await restablecerClave(userId);
              setSeguro(false);
              if ("error" in r) return void toast.error(r.error);
              setClave(r.clave);
            })
          }
        >
          {pendiente && <Loader2 className="animate-spin" />} Sí
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => setSeguro(false)}>
          No
        </Button>
      </span>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setSeguro(true)}>
      <KeyRound /> Nueva contraseña
    </Button>
  );
}
