import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hand } from "lucide-react";
import { BotonAccion } from "@/components/admin/boton-accion";
import { ProductosOcultos, type FilaOculto } from "@/components/admin/productos-ocultos";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { MOTIVO_OCULTO } from "@/lib/inventario/sincronizar";
import { calcularPrecio, getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";
import { volverAOcultar } from "./actions";

export const metadata: Metadata = { title: "Productos ocultos por inventario" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function OcultosPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const buscar = q
    ? { OR: [{ nombre: { contains: q, mode: "insensitive" as const } }, { codigo: { contains: q, mode: "insensitive" as const } }] }
    : {};
  const seleccion = {
    id: true,
    codigo: true,
    nombre: true,
    stock: true,
    precioSinIva: true,
    updatedAt: true,
    category: { select: { nombre: true, parent: { select: { nombre: true } } } },
  } as const;

  const [ocultos, manuales, { iva }] = await Promise.all([
    prisma.product.findMany({ where: { estado: "BORRADOR", motivoRechazo: MOTIVO_OCULTO, ...buscar }, orderBy: { nombre: "asc" }, select: seleccion }),
    prisma.product.findMany({ where: { stockManual: true, ...buscar }, orderBy: { nombre: "asc" }, select: { ...seleccion, estado: true } }),
    getConfigPrecios(),
  ]);

  // Último stock y fecha en que cada producto apareció en un inventario.
  const codigos = ocultos.map((o) => o.codigo);
  const ultimos = codigos.length
    ? await prisma.$queryRaw<{ codigo: string; stock: number; fecha: Date }[]>`
        SELECT DISTINCT ON (i."codigo") i."codigo", i."stock"::float8 AS "stock", c."createdAt" AS "fecha"
        FROM "InventarioItem" i JOIN "InventarioCarga" c ON c."id" = i."cargaId"
        WHERE i."codigo" = ANY(${codigos}::text[])
        ORDER BY i."codigo", c."createdAt" DESC`
    : [];
  const ultimoDe = new Map(ultimos.map((u) => [u.codigo, u]));
  const categoria = (c: { nombre: string; parent: { nombre: string } | null }) => (c.parent ? `${c.parent.nombre} › ${c.nombre}` : c.nombre);
  const publico = (p: { precioSinIva: { toString(): string } }) => calcularPrecio(p.precioSinIva, { iva, esDistribuidor: false }).conIva;

  const filas: FilaOculto[] = ocultos.map((o) => {
    const u = ultimoDe.get(o.codigo);
    return {
      id: o.id,
      codigo: o.codigo,
      nombre: o.nombre,
      categoria: categoria(o.category),
      precio: publico(o),
      ultimoStock: u ? Math.max(0, Math.floor(u.stock + 1e-9)) : 0,
      vistoEl: u ? fechaEC(u.fecha) : null,
    };
  });

  return (
    <div className="space-y-5">
      <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-sm text-marca-azul hover:underline">
        <ArrowLeft className="size-4" /> Inventario
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-marca-navy">Productos ocultos por inventario</h1>
        <p className="max-w-3xl text-sm text-marca-gris">
          Estos productos se ocultaron de la tienda porque <strong>no vinieron en el último Excel</strong> de la sucursal (no están borrados).
          Si sabes que sí los tienes, márcalos, revisa el stock y pulsa <strong>“Mostrar en la tienda”</strong>. Los que muestres a mano no se
          vuelven a ocultar con el próximo inventario; cuando aparezcan otra vez en un Excel, el Excel vuelve a mandar en su stock.
        </p>
      </header>

      <form className="flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o código…"
          className="h-9 flex-1 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring"
        />
        <button className="h-9 rounded-lg bg-marca-azul px-3 text-sm font-medium text-white hover:bg-marca-navy">Buscar</button>
      </form>

      <ProductosOcultos filas={filas} />

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 font-semibold text-marca-navy">
          <Hand className="size-4" /> Mostrados a mano <span className="font-normal text-marca-gris">({manuales.length})</span>
        </h2>
        <p className="text-sm text-marca-gris">
          Se ven en la tienda aunque no estén en el Excel. Su stock lo cambias editando el producto; si ya no los tienes, ocúltalos otra vez.
        </p>
        {manuales.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-marca-gris">Ninguno por ahora.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {manuales.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.nombre}</p>
                  <p className="text-xs text-marca-gris">
                    {m.codigo} · {categoria(m.category)} · {formatoUSD(publico(m))} · stock {m.stock} · mostrado el {fechaEC(m.updatedAt)}
                  </p>
                </div>
                <Link href={`/vendedor/productos/${m.id}`} className="text-sm text-marca-azul hover:underline">Editar stock</Link>
                <BotonAccion size="sm" variant="outline" accion={volverAOcultar.bind(null, m.id)} exito="Producto ocultado" confirmar="¿Ocultarlo de la tienda?">
                  Ocultar otra vez
                </BotonAccion>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
