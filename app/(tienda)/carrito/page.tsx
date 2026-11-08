import type { Metadata } from "next";
import { Carrito } from "@/components/carrito/carrito";
import { Migas } from "@/components/listado/migas";

export const metadata: Metadata = { title: "Carrito de compras", robots: { index: false } };

export default function CarritoPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
      <Migas items={[{ nombre: "Carrito" }]} />
      <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">Carrito de compras</h1>
      <Carrito />
    </main>
  );
}
