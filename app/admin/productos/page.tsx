import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ImageOff, Pencil, Search, Sparkles, Star } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { AccionConTexto, BotonAccion } from "@/components/admin/boton-accion";
import { Button } from "@/components/ui/button";
import { aprobarProducto, alternarEtiqueta, despublicarProducto, rechazarProducto } from "./actions";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { calcularPrecio, getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Aprobar productos" };

type Props = { searchParams: Promise<{ q?: string; page?: string }> };
const POR_PAGINA = 15;

export default async function AdminProductosPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const config = await getConfigPrecios();
  const publico = { iva: config.iva, esDistribuidor: false, descuento: 0 };

  const pendientes = await prisma.product.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true, codigo: true, nombre: true, slug: true, precioSinIva: true, stock: true, descripcion: true, updatedAt: true,
      brand: { select: { nombre: true } },
      category: { select: { nombre: true, parent: { select: { nombre: true } } } },
      images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
    },
  });

  // Publicados (para marcar destacados / nuevos)
  const where: Prisma.ProductWhereInput = {
    estado: "PUBLICADO",
    ...(q ? { OR: [{ nombre: { contains: q, mode: "insensitive" } }, { codigo: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const total = await prisma.product.count({ where });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number(sp.page) || 1), paginas);
  const publicados = await prisma.product.findMany({
    where,
    orderBy: [{ destacado: "desc" }, { nuevo: "desc" }, { nombre: "asc" }],
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: { id: true, codigo: true, nombre: true, slug: true, destacado: true, nuevo: true, stock: true },
  });
  const url = (page: number) => `/admin/productos?${new URLSearchParams({ ...(q ? { q } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marca-navy">Aprobar productos</h1>
        <Button asChild variant="outline"><Link href="/vendedor/productos">Ver catálogo completo</Link></Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-bold text-marca-navy">Esperando aprobación ({pendientes.length})</h2>
        {pendientes.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-marca-gris">No hay productos por aprobar. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {pendientes.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row">
                <span className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-white">
                  {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="96px" className="object-contain p-1" /> : <ImageOff className="m-auto mt-8 size-6 text-marca-gris" />}
                </span>
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="font-semibold text-marca-navy">{p.nombre}</p>
                  <p className="text-marca-gris">
                    {p.codigo} · {p.brand?.nombre ?? "Sin marca"} · {p.category.parent?.nombre} › {p.category.nombre}
                  </p>
                  <p>
                    <strong className="text-marca-azul">{formatoUSD(calcularPrecio(p.precioSinIva, publico).conIva)}</strong> con IVA · stock {p.stock}
                    <span className="text-marca-gris"> · enviado {fechaEC(p.updatedAt)}</span>
                  </p>
                  {p.descripcion && <p className="line-clamp-2 text-marca-gris">{p.descripcion}</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <BotonAccion size="sm" accion={aprobarProducto.bind(null, p.id)} exito="Producto publicado">
                      <Check /> Aprobar y publicar
                    </BotonAccion>
                    <AccionConTexto accion={rechazarProducto.bind(null, p.id)} exito="Producto rechazado" boton="Rechazar" placeholder="Motivo (el personal lo verá)" etiqueta={`Motivo de rechazo de ${p.codigo}`} />
                    <Button asChild size="sm" variant="ghost"><Link href={`/vendedor/productos/${p.id}`}><Pencil /> Revisar / editar</Link></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-marca-navy">Destacados y nuevos</h2>
          <form className="relative w-full sm:w-64" action="/admin/productos">
            <label htmlFor="buscar-publicado" className="sr-only">Buscar producto publicado</label>
            <input id="buscar-publicado" name="q" defaultValue={q} placeholder="Buscar publicado" className="h-9 w-full rounded-lg border border-input bg-white pr-9 pl-3 text-sm outline-none focus:border-ring" />
            <Search className="absolute top-2.5 right-3 size-4 text-marca-gris" />
          </form>
        </div>
        <ul className="divide-y rounded-xl border bg-card">
          {publicados.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1">
                <Link href={`/producto/${p.slug}`} target="_blank" className="line-clamp-1 hover:text-marca-azul">{p.nombre}</Link>
                <span className="text-xs text-marca-gris">{p.codigo} · stock {p.stock}</span>
              </span>
              <BotonAccion size="sm" variant={p.destacado ? "default" : "outline"} aria-pressed={p.destacado} accion={alternarEtiqueta.bind(null, p.id, "destacado")} exito={p.destacado ? "Ya no es destacado" : "Marcado como destacado"}>
                <Star className={p.destacado ? "fill-current" : ""} /> Destacado
              </BotonAccion>
              <BotonAccion size="sm" variant={p.nuevo ? "default" : "outline"} aria-pressed={p.nuevo} accion={alternarEtiqueta.bind(null, p.id, "nuevo")} exito={p.nuevo ? "Ya no es nuevo" : "Marcado como nuevo"}>
                <Sparkles /> Nuevo
              </BotonAccion>
              <BotonAccion size="sm" variant="ghost" className="text-destructive" confirmar="¿Quitar de la tienda?" accion={despublicarProducto.bind(null, p.id)} exito="Producto retirado de la tienda">
                Despublicar
              </BotonAccion>
            </li>
          ))}
        </ul>
        {paginas > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
            {pagina > 1 && <Link href={url(pagina - 1)} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent"><ChevronLeft className="size-4" /> Anterior</Link>}
            <span className="text-marca-gris">Página {pagina} de {paginas}</span>
            {pagina < paginas && <Link href={url(pagina + 1)} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">Siguiente <ChevronRight className="size-4" /></Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
