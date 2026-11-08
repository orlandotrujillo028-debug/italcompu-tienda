import type { Metadata } from "next";
import Link from "next/link";
import { Migas } from "@/components/listado/migas";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Stock por marca",
  description: "Encuentra productos por marca: Lenovo, HP, ASUS, Samsung, Epson y más, con garantía local en ITALCOMPU.",
};

export default async function MarcasPage() {
  const [marcas, conteos] = await Promise.all([
    prisma.brand.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, slug: true } }),
    prisma.product.groupBy({ by: ["brandId"], where: { estado: "PUBLICADO" }, _count: { _all: true } }),
  ]);
  const cantidad = (id: string) => conteos.find((c) => c.brandId === id)?._count._all ?? 0;
  const conStock = marcas.filter((m) => cantidad(m.id) > 0);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
      <Migas items={[{ nombre: "Marcas" }]} />
      <header>
        <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">Stock por marca</h1>
        <p className="text-sm text-marca-gris">{conStock.length} marcas con productos disponibles</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {conStock.map((m) => (
          <li key={m.id}>
            <Link
              href={`/marca/${m.slug}`}
              className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:border-marca-cyan hover:shadow-md"
            >
              <span className="text-lg font-extrabold tracking-tight text-marca-navy">{m.nombre}</span>
              <span className="text-xs text-marca-gris">
                {cantidad(m.id)} {cantidad(m.id) === 1 ? "producto" : "productos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
