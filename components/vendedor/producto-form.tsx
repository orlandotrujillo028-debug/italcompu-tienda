"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Plus, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { firmarSubidaImagen, guardarProducto } from "@/app/vendedor/productos/actions";
import { formatoPct, formatoUSD } from "@/lib/formato";
import { calcularPrecio } from "@/lib/precios-calculo";
import { productoSchema, urlImagenPermitida, type ProductoInput } from "@/lib/validaciones/producto";

type Categoria = { id: string; nombre: string; children: { id: string; nombre: string }[] };
type Props = {
  id?: string;
  inicial: ProductoInput;
  categorias: Categoria[];
  marcas: { id: string; nombre: string }[];
  config: { iva: number; descuentoDistribuidor: number };
  esAdmin: boolean;
};

const MAX_MB = 5;
const claseSelect = "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProductoForm({ id, inicial, categorias, marcas, config, esAdmin }: Props) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [imagenes, setImagenes] = useState<string[]>(inicial.imagenes);
  const [subiendo, setSubiendo] = useState(0);
  const [urlManual, setUrlManual] = useState("");
  const archivo = useRef<HTMLInputElement>(null);

  const padreInicial = categorias.find((c) => c.children.some((s) => s.id === inicial.categoryId))?.id ?? "";
  const [padre, setPadre] = useState(padreInicial);
  const subcategorias = categorias.find((c) => c.id === padre)?.children ?? [];

  const { register, handleSubmit, control, watch, setValue, formState } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: inicial,
  });
  const specs = useFieldArray({ control, name: "specs" });
  const e = formState.errors;

  // Vista previa de precios en vivo.
  const precio = Number(String(watch("precioSinIva") ?? "").replace(",", ".")) || 0;
  const publico = calcularPrecio(precio, { iva: config.iva, esDistribuidor: false, descuento: 0 });
  const distribuidor = calcularPrecio(precio, { iva: config.iva, esDistribuidor: true, descuento: config.descuentoDistribuidor });

  const enviar = (accion: "borrador" | "enviar") =>
    handleSubmit((datos) => {
      setError(undefined);
      startTransition(async () => {
        const r = await guardarProducto(id ?? null, { ...datos, imagenes }, accion);
        if ("error" in r) return setError(r.error);
        toast.success(
          r.estado === "PUBLICADO" ? "Producto publicado" : r.estado === "PENDIENTE" ? "Enviado a aprobación del administrador" : "Borrador guardado",
        );
        router.push("/vendedor/productos");
        router.refresh();
      });
    }, () => setError("Revisa los campos marcados en rojo."));

  // ---- Imágenes ----
  const subirArchivos = async (lista: FileList | null) => {
    if (!lista?.length) return;
    const files = [...lista].slice(0, 10 - imagenes.length);
    const grandes = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (grandes.length) toast.error(`Cada imagen debe pesar menos de ${MAX_MB} MB.`);
    const validos = files.filter((f) => f.size <= MAX_MB * 1024 * 1024 && f.type.startsWith("image/"));
    if (!validos.length) return;

    const firma = await firmarSubidaImagen();
    if ("error" in firma) return void toast.error(firma.error);

    setSubiendo(validos.length);
    for (const f of validos) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("api_key", firma.apiKey);
      fd.append("timestamp", String(firma.timestamp));
      fd.append("folder", firma.folder);
      fd.append("signature", firma.signature);
      try {
        const r = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, { method: "POST", body: fd });
        const json = await r.json();
        if (!r.ok || !json.secure_url) throw new Error(json.error?.message ?? "Error al subir");
        setImagenes((act) => [...act, json.secure_url as string].slice(0, 10));
      } catch (err) {
        toast.error(`No se pudo subir ${f.name}: ${(err as Error).message}`);
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
    if (archivo.current) archivo.current.value = "";
  };

  const agregarUrl = () => {
    const url = urlManual.trim();
    if (!urlImagenPermitida(url)) return void toast.error("Solo se aceptan enlaces https de Cloudinary o placehold.co.");
    if (imagenes.includes(url)) return void toast.info("Esa imagen ya está en la lista.");
    setImagenes((a) => [...a, url].slice(0, 10));
    setUrlManual("");
  };
  const mover = (i: number, dir: -1 | 1) =>
    setImagenes((a) => {
      const b = [...a];
      [b[i], b[i + dir]] = [b[i + dir], b[i]];
      return b;
    });

  return (
    <form onSubmit={(ev) => ev.preventDefault()} className="space-y-6" noValidate>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-bold text-marca-navy">Datos principales</h2>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Campo id="codigo" label="Código (SKU)" className="uppercase" error={e.codigo?.message} {...register("codigo")} />
          <Campo id="nombre" label="Nombre del producto" error={e.nombre?.message} {...register("nombre")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría</Label>
            <select
              id="categoria"
              className={claseSelect}
              value={padre}
              onChange={(ev) => {
                setPadre(ev.target.value);
                setValue("categoryId", "", { shouldDirty: true });
              }}
            >
              <option value="">Elige</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Subcategoría</Label>
            <select id="categoryId" className={claseSelect} disabled={!padre} aria-invalid={!!e.categoryId} {...register("categoryId")}>
              <option value="">{padre ? "Elige" : "Primero la categoría"}</option>
              {subcategorias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {e.categoryId && <p className="text-sm text-destructive">{e.categoryId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brandId">Marca</Label>
            <select id="brandId" className={claseSelect} {...register("brandId")}>
              <option value="">Sin marca</option>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-bold text-marca-navy">Precio, stock y garantía</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="precioSinIva" label="Precio SIN IVA (USD)" inputMode="decimal" error={e.precioSinIva?.message} {...register("precioSinIva")} />
          <Campo id="stock" label="Stock (unidades)" inputMode="numeric" error={e.stock?.message} {...register("stock")} />
          <Campo id="garantiaMeses" label="Garantía (meses)" inputMode="numeric" error={e.garantiaMeses?.message} {...register("garantiaMeses")} />
        </div>
        <dl className="grid gap-3 rounded-lg bg-marca-fondo p-3 text-sm sm:grid-cols-2" aria-live="polite">
          <div>
            <dt className="text-marca-gris">Precio público (con IVA {config.iva} %)</dt>
            <dd className="text-xl font-bold text-marca-azul">{formatoUSD(publico.conIva)}</dd>
          </div>
          <div>
            <dt className="text-marca-gris">Precio distribuidor ({formatoPct(config.descuentoDistribuidor)} % menos, con IVA)</dt>
            <dd className="text-xl font-bold text-marca-navy">{formatoUSD(distribuidor.conIva)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-bold text-marca-navy">Descripción y especificaciones</h2>
        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <textarea id="descripcion" rows={5} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring" {...register("descripcion")} />
          {e.descripcion && <p className="text-sm text-destructive">{e.descripcion.message}</p>}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Especificaciones</p>
          {specs.fields.length === 0 && <p className="text-sm text-marca-gris">Agrega datos técnicos como Procesador, RAM, Pantalla…</p>}
          {specs.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <input aria-label={`Nombre de la especificación ${i + 1}`} placeholder="Ej.: RAM" className="h-9 w-2/5 rounded-lg border border-input bg-white px-2 text-sm outline-none focus:border-ring" {...register(`specs.${i}.clave`)} />
              <input aria-label={`Valor de la especificación ${i + 1}`} placeholder="Ej.: 16 GB" className="h-9 flex-1 rounded-lg border border-input bg-white px-2 text-sm outline-none focus:border-ring" {...register(`specs.${i}.valor`)} />
              <button type="button" onClick={() => specs.remove(i)} aria-label={`Quitar especificación ${i + 1}`} className="flex size-9 items-center justify-center rounded-lg text-marca-gris hover:bg-destructive/10 hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ))}
          {e.specs && <p className="text-sm text-destructive">Completa o quita las especificaciones vacías.</p>}
          <Button type="button" variant="outline" size="sm" onClick={() => specs.append({ clave: "", valor: "" })} disabled={specs.fields.length >= 40}>
            <Plus /> Agregar especificación
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-bold text-marca-navy">Imágenes ({imagenes.length}/10)</h2>
          <p className="text-sm text-marca-gris">La primera es la principal. Usa las flechas para cambiar el orden.</p>
        </div>
        {imagenes.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {imagenes.map((url, i) => (
              <li key={url} className={`relative overflow-hidden rounded-lg border-2 bg-white ${i === 0 ? "border-marca-azul" : "border-border"}`}>
                <div className="relative aspect-square">
                  <Image src={url} alt={`Imagen ${i + 1}`} fill sizes="160px" className="object-contain p-1" />
                </div>
                {i === 0 && <span className="absolute top-1 left-1 rounded bg-marca-azul px-1.5 text-[10px] font-semibold text-white">Principal</span>}
                <div className="flex justify-between border-t bg-marca-fondo p-1">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover antes" className="flex size-7 items-center justify-center rounded disabled:opacity-30"><ArrowLeft className="size-3.5" /></button>
                  <button type="button" onClick={() => setImagenes((a) => a.filter((x) => x !== url))} aria-label="Quitar imagen" className="flex size-7 items-center justify-center rounded text-destructive"><Trash2 className="size-3.5" /></button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === imagenes.length - 1} aria-label="Mover después" className="flex size-7 items-center justify-center rounded disabled:opacity-30"><ArrowRight className="size-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input ref={archivo} type="file" accept="image/*" multiple hidden onChange={(ev) => subirArchivos(ev.target.files)} />
          <Button type="button" variant="outline" onClick={() => archivo.current?.click()} disabled={subiendo > 0 || imagenes.length >= 10}>
            {subiendo > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {subiendo > 0 ? `Subiendo ${subiendo}…` : "Subir imágenes"}
          </Button>
          <div className="flex flex-1 gap-2">
            <label htmlFor="url-imagen" className="sr-only">Pegar enlace de imagen</label>
            <input id="url-imagen" value={urlManual} onChange={(ev) => setUrlManual(ev.target.value)} placeholder="…o pega un enlace https de Cloudinary" className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-ring" />
            <Button type="button" variant="secondary" size="sm" className="h-9" onClick={agregarUrl} disabled={!urlManual.trim()}>
              <Link2 /> Agregar
            </Button>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-marca-fondo/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <p className="mr-auto hidden text-xs text-marca-gris sm:block">
          {esAdmin ? "Como administrador, al guardar se publica de inmediato." : "Al enviar, el administrador lo revisa antes de publicarlo (si solo cambias el stock, se mantiene publicado)."}
        </p>
        <Button asChild variant="ghost"><Link href="/vendedor/productos">Cancelar</Link></Button>
        <Button type="button" variant="outline" disabled={pendiente || subiendo > 0} onClick={enviar("borrador")}>
          <Save /> Guardar borrador
        </Button>
        <Button type="button" disabled={pendiente || subiendo > 0} onClick={enviar("enviar")}>
          {pendiente ? <Loader2 className="animate-spin" /> : <Send />}
          {esAdmin ? "Guardar y publicar" : "Enviar a aprobación"}
        </Button>
      </div>
    </form>
  );
}
