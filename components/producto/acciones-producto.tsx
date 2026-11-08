"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCarrito } from "@/lib/carrito-store";

/** Selector de cantidad + "Agregar al carrito" + "Comprar ahora". */
export function AccionesProducto({ productId, nombre, stock }: { productId: string; nombre: string; stock: number }) {
  const max = Math.min(stock, 99);
  const [cantidad, setCantidad] = useState(1);
  const agregar = useCarrito((s) => s.agregar);
  const router = useRouter();

  if (stock <= 0) {
    return (
      <Button size="lg" variant="outline" className="h-11 w-full" disabled>
        Producto agotado
      </Button>
    );
  }

  const cambiar = (n: number) => setCantidad(Math.max(1, Math.min(max, Number.isFinite(n) ? Math.floor(n) : 1)));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-marca-navy">Cantidad</span>
        <div className="flex items-center rounded-lg border bg-white">
          <button type="button" onClick={() => cambiar(cantidad - 1)} disabled={cantidad <= 1} aria-label="Quitar uno" className="flex size-10 items-center justify-center text-marca-navy disabled:opacity-40">
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            min={1}
            max={max}
            value={cantidad}
            onChange={(e) => cambiar(Number(e.target.value))}
            aria-label="Cantidad"
            className="h-10 w-12 border-x text-center text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button type="button" onClick={() => cambiar(cantidad + 1)} disabled={cantidad >= max} aria-label="Agregar uno" className="flex size-10 items-center justify-center text-marca-navy disabled:opacity-40">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          size="lg"
          variant="outline"
          className="h-11 border-marca-azul text-marca-azul hover:bg-accent"
          onClick={() => {
            agregar(productId, cantidad);
            toast.success("Agregado al carrito", {
              id: `carrito-${productId}`,
              description: `${cantidad} × ${nombre}`,
              action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
            });
          }}
        >
          <ShoppingCart />
          Agregar al carrito
        </Button>
        <Button
          size="lg"
          className="h-11"
          onClick={() => {
            agregar(productId, cantidad);
            router.push("/carrito");
          }}
        >
          <Zap />
          Comprar ahora
        </Button>
      </div>
    </div>
  );
}
