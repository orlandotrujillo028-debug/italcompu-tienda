"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCarrito } from "@/lib/carrito-store";

/** Agrega el producto al carrito y avisa con un mensaje. (Sin stock se usa `BotonConsultar`.) */
export function BotonComprar({ productId, nombre }: { productId: string; nombre: string }) {
  const agregar = useCarrito((s) => s.agregar);
  const router = useRouter();

  return (
    <Button
      className="h-9 w-full"
      onClick={() => {
        agregar(productId);
        toast.success("Agregado al carrito", {
          id: `carrito-${productId}`, // clics seguidos actualizan el mismo aviso
          description: nombre,
          action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
        });
      }}
    >
      <ShoppingCart />
      Comprar
    </Button>
  );
}
