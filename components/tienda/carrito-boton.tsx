"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShoppingCart } from "lucide-react";
import { useUnidadesCarrito } from "@/lib/carrito-store";

const sinSuscripcion = () => () => {};

/** Icono del carrito con contador (el contador aparece al cargar, porque vive en el navegador). */
export function CarritoBoton() {
  const unidades = useUnidadesCarrito();
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const n = montado ? unidades : 0;

  return (
    <Link
      href="/carrito"
      className="relative flex size-10 items-center justify-center rounded-lg text-marca-navy hover:bg-muted"
      aria-label={n > 0 ? `Carrito, ${n} ${n === 1 ? "producto" : "productos"}` : "Carrito vacío"}
    >
      <ShoppingCart className="size-5" />
      {n > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-marca-cyan px-1 text-[11px] font-bold text-marca-navy">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
