"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/auth/campo";
import { subirImagenCloudinary } from "@/components/admin/subir-imagen";
import { eliminarBanner, guardarBanner } from "@/app/admin/banners/actions";

type Banner = { id: string; titulo: string; subtitulo: string | null; imagen: string; enlace: string | null; orden: number; activo: boolean };

function FormBanner({ inicial, alTerminar }: { inicial?: Banner; alTerminar: () => void }) {
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [d, setD] = useState({
    titulo: inicial?.titulo ?? "",
    subtitulo: inicial?.subtitulo ?? "",
    imagen: inicial?.imagen ?? "/banners/banner-1.svg",
    enlace: inicial?.enlace ?? "",
    orden: String(inicial?.orden ?? 0),
    activo: inicial?.activo ?? true,
  });

  const subir = async (f?: File) => {
    if (!f) return;
    setSubiendo(true);
    try {
      setD((x) => ({ ...x, imagen: "" }));
      const url = await subirImagenCloudinary(f, 8);
      setD((x) => ({ ...x, imagen: url }));
    } catch (e) {
      toast.error((e as Error).message);
      setD((x) => ({ ...x, imagen: inicial?.imagen ?? "/banners/banner-1.svg" }));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await guardarBanner({ id: inicial?.id, ...d });
          if ("error" in r) return void toast.error(r.error);
          toast.success(inicial ? "Banner actualizado" : "Banner creado");
          alTerminar();
          router.refresh();
        });
      }}
    >
      <div className="relative aspect-[16/5] overflow-hidden rounded-lg bg-marca-navy">
        {d.imagen && <Image src={d.imagen} alt="" fill sizes="800px" unoptimized={d.imagen.endsWith(".svg")} className="object-cover" />}
        <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-marca-navy/85 to-transparent p-4 text-white">
          <p className="text-lg font-extrabold sm:text-2xl">{d.titulo || "Título del banner"}</p>
          {d.subtitulo && <p className="text-sm">{d.subtitulo}</p>}
        </div>
        {subiendo && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"><Loader2 className="animate-spin" /></span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input ref={archivo} type="file" accept="image/*" hidden onChange={(e) => subir(e.target.files?.[0])} />
        <Button type="button" size="sm" variant="outline" disabled={subiendo} onClick={() => archivo.current?.click()}><ImagePlus /> Subir imagen (1600×500)</Button>
        <span className="text-marca-gris">o fondo incluido:</span>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setD({ ...d, imagen: `/banners/banner-${n}.svg` })} className={`h-8 w-16 overflow-hidden rounded border-2 ${d.imagen === `/banners/banner-${n}.svg` ? "border-marca-azul" : "border-transparent"}`} aria-label={`Fondo ${n}`}>
            <Image src={`/banners/banner-${n}.svg`} alt="" width={64} height={32} unoptimized className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id="b-titulo" label="Título" value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} />
        <Campo id="b-subtitulo" label="Subtítulo (opcional)" value={d.subtitulo} onChange={(e) => setD({ ...d, subtitulo: e.target.value })} />
        <Campo id="b-enlace" label="Enlace del botón “Ver más”" placeholder="/categoria/laptops" value={d.enlace} onChange={(e) => setD({ ...d, enlace: e.target.value })} />
        <div className="flex items-end gap-4">
          <Campo id="b-orden" label="Orden" type="number" min={0} value={d.orden} onChange={(e) => setD({ ...d, orden: e.target.value })} className="w-20" />
          <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={d.activo} onChange={(e) => setD({ ...d, activo: e.target.checked })} className="size-4 accent-marca-azul" /> Visible en la tienda</label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente || subiendo || !d.imagen}>{pendiente && <Loader2 className="animate-spin" />} Guardar</Button>
        <Button type="button" variant="ghost" onClick={alTerminar}>Cancelar</Button>
      </div>
    </form>
  );
}

export function BannersAdmin({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [pendiente, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {banners.map((b) =>
        editando === b.id ? (
          <FormBanner key={b.id} inicial={b} alTerminar={() => setEditando(null)} />
        ) : (
          <div key={b.id} className={`flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center ${b.activo ? "" : "opacity-60"}`}>
            <span className="relative aspect-[16/5] w-full shrink-0 overflow-hidden rounded-lg sm:w-56">
              <Image src={b.imagen} alt="" fill sizes="224px" unoptimized={b.imagen.endsWith(".svg")} className="object-cover" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-marca-navy">{b.titulo}</p>
              {b.subtitulo && <p className="text-marca-gris">{b.subtitulo}</p>}
              <p className="text-xs text-marca-gris">Orden {b.orden} · {b.enlace ?? "sin enlace"} {!b.activo && <span className="inline-flex items-center gap-1"><EyeOff className="size-3" /> oculto</span>}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditando(b.id)} aria-label={`Editar ${b.titulo}`}><Pencil /></Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={pendiente}
                aria-label={`Eliminar ${b.titulo}`}
                onClick={() =>
                  startTransition(async () => {
                    const r = await eliminarBanner(b.id);
                    if ("error" in r) return void toast.error(r.error);
                    toast.success("Banner eliminado");
                    router.refresh();
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ),
      )}
      {nuevo ? <FormBanner alTerminar={() => setNuevo(false)} /> : <Button onClick={() => setNuevo(true)}><Plus /> Nuevo banner</Button>}
    </div>
  );
}
