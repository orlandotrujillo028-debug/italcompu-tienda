"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DireccionForm } from "@/components/checkout/direccion-form";
import { eliminarDireccion, marcarPrincipal } from "@/app/cuenta/actions";
import type { DireccionInput } from "@/lib/validaciones/pedido";

type Direccion = { id: string; nombre: string; telefono: string; provincia: string; ciudad: string; direccion: string; referencia: string | null; principal: boolean };

export function ListaDirecciones({ direcciones, nombreUsuario }: { direcciones: Direccion[]; nombreUsuario: string }) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const listo = (texto: string) => {
    toast.success(texto);
    setCreando(false);
    setEditando(null);
    setBorrando(null);
    router.refresh();
  };

  const ejecutar = (accion: () => Promise<{ ok: true } | { error: string }>, texto: string) =>
    startTransition(async () => {
      const r = await accion();
      if ("error" in r) toast.error(r.error);
      else listo(texto);
    });

  return (
    <div className="space-y-4">
      {direcciones.length === 0 && !creando && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center">
          <MapPin className="size-10 text-marca-cyan" />
          <p className="font-semibold text-marca-navy">No tienes direcciones guardadas</p>
          <p className="text-sm text-marca-gris">Agrega una para comprar más rápido.</p>
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {direcciones.map((d) =>
          editando === d.id ? (
            <li key={d.id} className="md:col-span-2">
              <DireccionForm
                editar={{
                  id: d.id,
                  valores: {
                    nombre: d.nombre,
                    telefono: d.telefono,
                    provincia: d.provincia as DireccionInput["provincia"],
                    ciudad: d.ciudad,
                    direccion: d.direccion,
                    referencia: d.referencia ?? "",
                    principal: d.principal,
                  },
                }}
                alGuardar={() => listo("Dirección actualizada")}
                alCancelar={() => setEditando(null)}
              />
            </li>
          ) : (
            <li key={d.id} className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${d.principal ? "border-marca-azul" : ""}`}>
              <div className="space-y-0.5 text-sm">
                <p className="flex items-center gap-2 font-semibold text-marca-navy">
                  {d.nombre}
                  {d.principal && <span className="rounded bg-marca-azul px-1.5 py-0.5 text-[11px] font-semibold text-white">Principal</span>}
                </p>
                <p>{d.direccion}</p>
                <p className="text-marca-gris">
                  {d.ciudad}, {d.provincia}
                </p>
                <p className="text-marca-gris">
                  {d.telefono}
                  {d.referencia && ` · ${d.referencia}`}
                </p>
              </div>

              {borrando === d.id ? (
                <div className="mt-auto flex flex-wrap items-center gap-2 rounded-lg bg-destructive/10 p-2 text-sm">
                  <span className="flex-1 text-destructive">¿Eliminar esta dirección?</span>
                  <Button size="sm" variant="destructive" disabled={pendiente} onClick={() => ejecutar(() => eliminarDireccion(d.id), "Dirección eliminada")}>
                    Sí, eliminar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setBorrando(null)}>
                    No
                  </Button>
                </div>
              ) : (
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditando(d.id)}>
                    <Pencil /> Editar
                  </Button>
                  {!d.principal && (
                    <Button size="sm" variant="outline" disabled={pendiente} onClick={() => ejecutar(() => marcarPrincipal(d.id), "Dirección principal actualizada")}>
                      <Star /> Hacer principal
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setBorrando(d.id)} aria-label={`Eliminar dirección ${d.direccion}`}>
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      {creando ? (
        <DireccionForm nombreInicial={nombreUsuario} alGuardar={() => listo("Dirección guardada")} alCancelar={() => setCreando(false)} />
      ) : (
        !editando && (
          <Button onClick={() => setCreando(true)}>
            <Plus /> Agregar dirección
          </Button>
        )
      )}
    </div>
  );
}
