import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff, Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { formatoUSD } from "@/lib/formato";
import { calcularPrecio, getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Productos" };

const POR_PAGINA = 20;

const ESTADOS = {
  todos: { texto: "Todos", uno: "", color: "" },
  PUBLICADO: { texto: "Publicados", uno: "Publicado", color: "bg-emerald-100 text-emerald-800" },
  PENDIENTE: { texto: "Por aprobar", uno: "Por aprobar", color: "bg-amber-100 text-amber-800" },
  RECHAZADO: { texto: "Rechazados", uno: "Rechazado", color: "bg-red-100 text-red-800" },
  BORRADOR: { texto: "Borradores", uno: "Borrador", color: "bg-slate-100 text-slate-700" },
} as const;
type Filtro = keyof typeof ESTADOS;

type Props = { searchParams: Promise<{ q?: string; estado?: string; stock?: string; page?: string }> };

export default async function ProductosVendedorPage({ searchParams }: Props) {
  await requireRole("VENDEDOR", "ADMIN");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const estado: Filtro = sp.estado && sp.estado in ESTADOS ? (sp.estado as Filtro) : "todos";
  const stockBajo = sp.stock === "bajo";

  const where: Prisma.ProductWhereInput = {
    ...(estado !== "todos" ? { estado } : {}),
    ...(stockBajo ? { stock: { lte: 5 } } : {}),
    ...(q ? { OR: [{ nombre: { contains: q, mode: "insensitive" } }, { codigo: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [total, conteos, config] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["estado"], _count: { _all: true } }),
    getConfigPrecios(),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number(sp.page) || 1), paginas);
  const productos = await prisma.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: {
      id: true,
      codigo: true,
      nombre: true,
      precioSinIva: true,
      stock: true,
      estado: true,
      motivoRechazo: true,
      category: { select: { nombre: true, parent: { select: { nombre: true } } } },
      images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
    },
  });

  const cuenta = (e: Filtro) => (e === "todos" ? conteos.reduce((t, c) => t + c._count._all, 0) : (conteos.find((c) => c.estado === e)?._count._all ?? 0));
  const url = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { q: q || undefined, estado: estado !== "todos" ? estado : undefined, stock: stockBajo ? "bajo" : undefined, ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    return `/vendedor/productos${p.size ? `?${p}` : ""}`;
  };
  const publico = { iva: config.iva, esDistribuidor: false, descuento: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marca-navy">Productos</h1>
        <Button asChild>
          <Link href="/vendedor/productos/nuevo">
            <Plus /> Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {(Object.keys(ESTADOS) as Filtro[]).map((e) => (
            <Link
              key={e}
              href={url({ estado: e === "todos" ? undefined : e, page: undefined })}
              aria-current={estado === e ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${estado === e ? "border-marca-azul bg-marca-azul text-white" : "bg-white text-marca-navy hover:bg-accent"}`}
            >
              {ESTADOS[e].texto} <span className="opacity-75">({cuenta(e)})</span>
            </Link>
          ))}
          {stockBajo && (
            <Link href={url({ stock: undefined })} className="shrink-0 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
              Stock bajo ✕
            </Link>
          )}
        </nav>
        <form className="relative lg:w-72" action="/vendedor/productos">
          {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
          <label htmlFor="buscar-producto" className="sr-only">Buscar por nombre o código</label>
          <input id="buscar-producto" name="q" defaultValue={q} placeholder="Buscar por nombre o código" className="h-9 w-full rounded-lg border border-input bg-white pr-9 pl-3 text-sm outline-none focus:border-ring" />
          <Search className="absolute top-2.5 right-3 size-4 text-marca-gris" />
        </form>
      </div>

      {productos.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-marca-gris">No hay productos con este filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-marca-fondo text-left text-xs text-marca-gris uppercase">
              <tr>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium">Categoría</th>
                <th className="px-3 py-2.5 text-right font-medium">Precio (con IVA)</th>
                <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-accent/40">
                  <td className="px-3 py-2">
                    <Link href={`/vendedor/productos/${p.id}`} className="flex items-center gap-3 hover:text-marca-azul">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded border bg-white">
                        {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-contain p-0.5" /> : <ImageOff className="m-auto mt-2.5 size-4 text-marca-gris" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium">{p.nombre}</span>
                        <span className="text-xs text-marca-gris">{p.codigo}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-marca-gris">
                    {p.category.parent ? `${p.category.parent.nombre} › ` : ""}
                    {p.category.nombre}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatoUSD(calcularPrecio(p.precioSinIva, publico).conIva)}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-amber-700" : ""}`}>{p.stock}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADOS[p.estado].color}`}>{ESTADOS[p.estado].uno}</span>
                    {p.estado === "RECHAZADO" && p.motivoRechazo && <span className="mt-0.5 block max-w-48 text-xs text-destructive">{p.motivoRechazo}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link href={url({ page: String(pagina - 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              <ChevronLeft className="size-4" /> Anterior
            </Link>
          )}
          <span className="text-marca-gris">Página {pagina} de {paginas}</span>
          {pagina < paginas && (
            <Link href={url({ page: String(pagina + 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">
              Siguiente <ChevronRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
