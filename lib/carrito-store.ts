"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Carrito del navegador (funciona sin iniciar sesión).
 * Solo guarda QUÉ productos y CUÁNTOS: precios y stock se vuelven a consultar
 * en el servidor (así un distribuidor ve su precio y nadie puede alterarlo).
 * El Paso 8 completa la página /carrito y el checkout.
 */
export type ItemCarrito = { productId: string; cantidad: number };

type EstadoCarrito = {
  items: ItemCarrito[];
  agregar: (productId: string, cantidad?: number) => void;
  cambiarCantidad: (productId: string, cantidad: number) => void;
  quitar: (productId: string) => void;
  vaciar: () => void;
};

const MAX_POR_PRODUCTO = 99;

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      items: [],
      agregar: (productId, cantidad = 1) =>
        set(({ items }) => {
          const existe = items.find((i) => i.productId === productId);
          if (!existe) return { items: [...items, { productId, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) }] };
          return {
            items: items.map((i) =>
              i.productId === productId ? { ...i, cantidad: Math.min(i.cantidad + cantidad, MAX_POR_PRODUCTO) } : i,
            ),
          };
        }),
      cambiarCantidad: (productId, cantidad) =>
        set(({ items }) => ({
          items:
            cantidad <= 0
              ? items.filter((i) => i.productId !== productId)
              : items.map((i) => (i.productId === productId ? { ...i, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) } : i)),
        })),
      quitar: (productId) => set(({ items }) => ({ items: items.filter((i) => i.productId !== productId) })),
      vaciar: () => set({ items: [] }),
    }),
    { name: "italcompu-carrito", version: 1 },
  ),
);

/** Total de unidades en el carrito (para el contador del header). */
export const useUnidadesCarrito = () => useCarrito((s) => s.items.reduce((t, i) => t + i.cantidad, 0));
