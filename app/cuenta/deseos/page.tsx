import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/producto/product-card";
import { requireUser } from "@/lib/auth-guards";
import type { ProductoTarjeta } from "@/lib/catalogo";
import { getTarifa } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Lista de deseos" };

export default async function DeseosPage() {
  const usuario = await requireUser();
  const [filas, tarifa] = await Promise.all([
    prisma.wishlistItem.findMany({
      // Solo productos que siguen publicados (si el admin despublica uno, desaparece de la lista).
      where: { userId: usuario.id, product: { estado: "PUBLICADO" } },
      orderBy: { createdAt: "desc" },
      select: {
        product: {
          select: {
            id: true,
            slug: true,
            nombre: true,
            codigo: true,
            precioSinIva: true,
            precioDistribuidorSinIva: true,
            stock: true,
            destacado: true,
            nuevo: true,
            brand: { select: { nombre: true } },
            images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    getTarifa(),
  ]);

  const productos: ProductoTarjeta[] = filas.map(({ product: p }) => ({
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    codigo: p.codigo,
    precioSinIva: Number(p.precioSinIva),
    precioDistribuidorSinIva: Number(p.precioDistribuidorSinIva),
    stock: p.stock,
    destacado: p.destacado,
    nuevo: p.nuevo,
    marca: p.brand?.nombre ?? null,
    imagen: p.images[0]?.url ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca-navy">Lista de deseos</h1>
        <p className="text-sm text-marca-gris">
          {productos.length} {productos.length === 1 ? "producto guardado" : "productos guardados"}. Toca el corazón para quitarlos.
        </p>
      </div>

      {productos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center">
          <Heart className="size-10 text-marca-cyan" />
          <p className="font-semibold text-marca-navy">Tu lista de deseos está vacía</p>
          <p className="text-sm text-marca-gris">Guarda productos con el corazón para verlos aquí.</p>
          <Link href="/" className="text-sm font-medium text-marca-azul hover:underline">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {productos.map((p) => (
            <li key={p.id}>
              <ProductCard producto={p} tarifa={tarifa} enDeseos />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
