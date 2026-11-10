"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconoCategoria } from "@/components/tienda/iconos";
import { eliminarCategoria, eliminarMarca, guardarCategoria, guardarMarca } from "@/app/admin/catalogo/actions";

type Sub = { id: string; nombre: string; orden: number; activa: boolean; productos: number };
type Cat = Sub & { slug: string; icono: string | null; imagen: string | null; children: Sub[] };
type Marca = { id: string; nombre: string; productos: number };

const ICONOS = ["monitor", "laptop", "cpu", "hard-drive", "mouse", "monitor-smartphone", "printer", "smartphone", "tv", "battery-charging", "headphones", "router", "server", "app-window", "gamepad-2", "house", "cable", "backpack", "wrench", "armchair"];
const input = "h-8 rounded-md border border-input bg-white px-2 text-sm outline-none focus:border-ring";

function useAccion() {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const ejecutar = (fn: () => Promise<{ ok: true } | { error: string }>, exito: string, despues?: () => void) =>
    startTransition(async () => {
      const r = await fn();
      if ("error" in r) return void toast.error(r.error);
      toast.success(exito);
      despues?.();
      router.refresh();
    });
  return { pendiente, ejecutar };
}

/** Fila editable de categoría o subcategoría. */
function FormCategoria({ inicial, parentId, conIcono, alTerminar }: { inicial?: Cat | Sub; parentId?: string; conIcono?: boolean; alTerminar: () => void }) {
  const { pendiente, ejecutar } = useAccion();
  const [d, setD] = useState({
    nombre: inicial?.nombre ?? "",
    orden: String(inicial?.orden ?? 0),
    activa: inicial?.activa ?? true,
    icono: (inicial as Cat | undefined)?.icono ?? "",
    imagen: (inicial as Cat | undefined)?.imagen ?? "",
  });
  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-lg bg-marca-fondo p-2"
      onSubmit={(e) => {
        e.preventDefault();
        ejecutar(() => guardarCategoria({ id: inicial?.id, parentId, ...d, icono: conIcono ? d.icono : undefined }), inicial ? "Categoría actualizada" : "Categoría creada", alTerminar);
      }}
    >
      <input aria-label="Nombre" required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} placeholder="Nombre" className={`${input} min-w-0 flex-1`} />
      <input aria-label="Orden" type="number" min={0} value={d.orden} onChange={(e) => setD({ ...d, orden: e.target.value })} className={`${input} w-16`} title="Orden (menor = primero)" />
      {conIcono && (
        <select aria-label="Icono" value={d.icono} onChange={(e) => setD({ ...d, icono: e.target.value })} className={input}>
          <option value="">Icono</option>
          {ICONOS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      )}
      {conIcono && <input aria-label="Imagen (enlace)" value={d.imagen} onChange={(e) => setD({ ...d, imagen: e.target.value })} placeholder="Imagen (enlace Cloudinary, opcional)" className={`${input} w-full sm:w-56`} />}
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={d.activa} onChange={(e) => setD({ ...d, activa: e.target.checked })} className="accent-marca-azul" /> Visible</label>
      <Button size="sm" type="submit" disabled={pendiente}>{pendiente && <Loader2 className="animate-spin" />} Guardar</Button>
      <Button size="sm" type="button" variant="ghost" onClick={alTerminar}>Cancelar</Button>
    </form>
  );
}

export function CategoriasAdmin({ categorias }: { categorias: Cat[] }) {
  const { pendiente, ejecutar } = useAccion();
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevaSub, setNuevaSub] = useState<string | null>(null);
  const [nueva, setNueva] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {categorias.map((c) => (
        <div key={c.id} className={`rounded-xl border bg-card ${c.activa ? "" : "opacity-60"}`}>
          {editando === c.id ? (
            <div className="p-2"><FormCategoria inicial={c} conIcono alTerminar={() => setEditando(null)} /></div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button type="button" onClick={() => setAbierta(abierta === c.id ? null : c.id)} aria-expanded={abierta === c.id} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <IconoCategoria nombre={c.icono} className="size-5 text-marca-azul" />
                <span className="font-semibold text-marca-navy">{c.nombre}</span>
                {!c.activa && <span className="flex items-center gap-1 text-xs text-marca-gris"><EyeOff className="size-3" /> oculta</span>}
                <span className="text-xs text-marca-gris">· {c.children.length} subcategorías · orden {c.orden}</span>
                <ChevronDown className={`ml-auto size-4 text-marca-gris transition ${abierta === c.id ? "rotate-180" : ""}`} />
              </button>
              <Button size="sm" variant="ghost" onClick={() => setEditando(c.id)} aria-label={`Editar ${c.nombre}`}><Pencil /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" disabled={pendiente} onClick={() => ejecutar(() => eliminarCategoria(c.id), "Categoría eliminada")} aria-label={`Eliminar ${c.nombre}`}><Trash2 /></Button>
            </div>
          )}
          {abierta === c.id && (
            <ul className="space-y-1 border-t p-3 pl-10">
              {c.children.map((s) => (
                <li key={s.id}>
                  {editando === s.id ? (
                    <FormCategoria inicial={s} parentId={c.id} alTerminar={() => setEditando(null)} />
                  ) : (
                    <div className={`flex items-center gap-2 text-sm ${s.activa ? "" : "opacity-60"}`}>
                      <span className="flex-1">{s.nombre} <span className="text-xs text-marca-gris">· {s.productos} productos · orden {s.orden}{s.activa ? "" : " · oculta"}</span></span>
                      <Button size="sm" variant="ghost" onClick={() => setEditando(s.id)} aria-label={`Editar ${s.nombre}`}><Pencil /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={pendiente} onClick={() => ejecutar(() => eliminarCategoria(s.id), "Subcategoría eliminada")} aria-label={`Eliminar ${s.nombre}`}><Trash2 /></Button>
                    </div>
                  )}
                </li>
              ))}
              <li>
                {nuevaSub === c.id ? (
                  <FormCategoria parentId={c.id} alTerminar={() => setNuevaSub(null)} />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setNuevaSub(c.id)}><Plus /> Subcategoría</Button>
                )}
              </li>
            </ul>
          )}
        </div>
      ))}
      {nueva ? <FormCategoria conIcono alTerminar={() => setNueva(false)} /> : <Button onClick={() => setNueva(true)}><Plus /> Nueva categoría principal</Button>}
    </div>
  );
}

export function MarcasAdmin({ marcas }: { marcas: Marca[] }) {
  const { pendiente, ejecutar } = useAccion();
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [nuevo, setNuevo] = useState("");

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ejecutar(() => guardarMarca({ nombre: nuevo }), "Marca creada", () => setNuevo(""));
        }}
      >
        <label htmlFor="nueva-marca" className="sr-only">Nueva marca</label>
        <input id="nueva-marca" value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Nueva marca" className={`${input} h-9 flex-1`} />
        <Button type="submit" disabled={pendiente || !nuevo.trim()}><Plus /> Agregar</Button>
      </form>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {marcas.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            {editando === m.id ? (
              <form
                className="flex flex-1 gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  ejecutar(() => guardarMarca({ id: m.id, nombre }), "Marca actualizada", () => setEditando(null));
                }}
              >
                <input aria-label="Nombre de la marca" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${input} min-w-0 flex-1`} />
                <Button size="sm" type="submit" disabled={pendiente}>OK</Button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-medium">{m.nombre} <span className="text-xs font-normal text-marca-gris">· {m.productos}</span></span>
                <Button size="sm" variant="ghost" onClick={() => { setEditando(m.id); setNombre(m.nombre); }} aria-label={`Editar ${m.nombre}`}><Pencil /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={pendiente} onClick={() => ejecutar(() => eliminarMarca(m.id), "Marca eliminada")} aria-label={`Eliminar ${m.nombre}`}><Trash2 /></Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
