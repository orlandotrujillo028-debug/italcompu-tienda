"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mostrarOcultos } from "@/app/admin/inventario/ocultos/actions";
import { formatoUSD } from "@/lib/formato";

export type FilaOculto = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number; // público con IVA
  ultimoStock: number; // en el último Excel en que apareció
  vistoEl: string | null; // fecha de ese Excel
};

/** Lista de productos ocultos por inventario: marcar, ajustar stock y volver a mostrarlos. */
export function ProductosOcultos({ filas }: { filas: FilaOculto[] }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  // Solo guarda lo que el admin escribió; si no tocó la casilla, vale el último stock conocido
  // (así también funciona con filas que aparecen después de refrescar, p. ej. tras "Ocultar otra vez").
  const [editado, setEditado] = useState<Record<string, string>>({});
  const stockDe = (f: FilaOculto) => editado[f.id] ?? String(f.ultimoStock);

  const alternar = (id: string) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const todos = filas.length > 0 && marcados.size === filas.length;
  const conStock = filas.filter((f) => f.ultimoStock > 0);

  const mostrar = () =>
    startTransition(async () => {
      const datos = filas.filter((f) => marcados.has(f.id)).map((f) => ({ id: f.id, stock: stockDe(f).trim() || "0" }));
      if (datos.length === 0) return;
      const r = await mostrarOcultos(datos);
      if ("error" in r) return void toast.error(r.error);
      toast.success(`${datos.length} producto(s) visibles otra vez en la tienda`);
      setMarcados(new Set());
      router.refresh();
    });

  if (filas.length === 0) {
    return <p className="rounded-xl border bg-card p-8 text-center text-sm text-marca-gris">No hay productos ocultos por inventario. 👍</p>;
  }

  return (
    <section className="space-y-2">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-3 backdrop-blur">
        <span className="text-sm font-semibold text-marca-navy">
          Ocultos: {filas.length} · marcados: {marcados.size}
        </span>
        <Button size="sm" variant="outline" onClick={() => setMarcados(todos ? new Set() : new Set(filas.map((f) => f.id)))}>
          {todos ? "Quitar todos" : "Marcar todos"}
        </Button>
        {conStock.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setMarcados(new Set(conStock.map((f) => f.id)))}>
            Marcar los que tenían stock ({conStock.length})
          </Button>
        )}
        <Button size="sm" className="ml-auto" disabled={pendiente || marcados.size === 0} onClick={mostrar}>
          {pendiente ? <Loader2 className="animate-spin" /> : <Eye />} Mostrar en la tienda ({marcados.size})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-marca-fondo/70 text-left text-xs text-marca-gris">
            <tr>
              <th className="w-10 px-3 py-2"><span className="sr-only">Marcar</span></th>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="px-3 py-2 text-right font-medium">Último stock</th>
              <th className="w-28 px-3 py-2 text-right font-medium">Stock a mostrar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filas.map((f) => (
              <tr key={f.id} className={marcados.has(f.id) ? "bg-marca-cyan/10" : ""}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Marcar ${f.nombre}`}
                    checked={marcados.has(f.id)}
                    onChange={() => alternar(f.id)}
                    className="size-4 accent-marca-azul"
                  />
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium">{f.nombre}</p>
                  <p className="text-xs text-marca-gris">
                    <span className="font-mono">{f.codigo}</span> · {f.categoria}
                  </p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoUSD(f.precio)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {f.ultimoStock}
                  {f.vistoEl && <span className="block text-xs text-marca-gris">al {f.vistoEl}</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`Stock para ${f.nombre}`}
                    value={stockDe(f)}
                    onChange={(e) => {
                      setEditado((s) => ({ ...s, [f.id]: e.target.value }));
                      if (!marcados.has(f.id)) alternar(f.id);
                    }}
                    className="h-8 w-20 rounded-md border border-input bg-white px-2 text-right tabular-nums outline-none focus:border-ring"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
