import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ExternalLink, XCircle } from "lucide-react";
import { ProductoForm } from "@/components/vendedor/producto-form";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { datosFormularioProducto } from "../datos-form";

export const metadata: Metadata = { title: "Editar producto" };

type Props = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: Props) {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const { id } = await params;
  const [p, datos] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { orden: "asc" } } } }),
    datosFormularioProducto(),
  ]);
  if (!p) notFound();

  const specs = Array.isArray(p.specs)
    ? (p.specs as unknown[]).filter((s): s is { clave: string; valor: string } => !!s && typeof s === "object" && "clave" in s && "valor" in s)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/vendedor/productos" className="text-sm text-marca-azul hover:underline">← Productos</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-marca-navy">Editar producto</h1>
          {p.estado === "PUBLICADO" && (
            <Link href={`/producto/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-marca-azul hover:underline">
              Ver en la tienda <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {p.estado === "RECHAZADO" && (
        <p className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span><strong>Rechazado por el administrador.</strong> {p.motivoRechazo ?? "Sin motivo indicado."} Corrige y vuelve a enviarlo.</span>
        </p>
      )}
      {p.estado === "PENDIENTE" && (
        <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Clock className="mt-0.5 size-4 shrink-0" /> Esperando aprobación del administrador. No se muestra en la tienda todavía.
        </p>
      )}

      <ProductoForm
        {...datos}
        id={p.id}
        esAdmin={usuario.rol === "ADMIN"}
        inicial={{
          codigo: p.codigo,
          nombre: p.nombre,
          categoryId: p.categoryId,
          brandId: p.brandId ?? "",
          precioSinIva: String(p.precioSinIva),
          stock: p.stock,
          garantiaMeses: p.garantiaMeses,
          descripcion: p.descripcion ?? "",
          specs: specs.map((s) => ({ clave: String(s.clave), valor: String(s.valor) })),
          imagenes: p.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
