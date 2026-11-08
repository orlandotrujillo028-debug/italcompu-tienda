"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { cotizarCarrito } from "@/app/(tienda)/carrito/actions";
import { useCarrito } from "@/lib/carrito-store";
import type { Cotizacion } from "@/lib/pedido";
import type { MetodoEnvio } from "@/lib/validaciones/pedido";

const sinSuscripcion = () => () => {};

/**
 * Pide al servidor la cotización del carrito cada vez que cambia.
 * Si el servidor ajusta algo (agotado, poco stock), corrige el carrito y avisa.
 */
export function useCotizacion(metodoEnvio: MetodoEnvio = "DOMICILIO") {
  const items = useCarrito((s) => s.items);
  const sincronizar = useCarrito((s) => s.sincronizar);
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const peticion = useRef(0);
  const clave = JSON.stringify(items);

  useEffect(() => {
    if (!montado) return;
    const id = ++peticion.current;
    const lista = JSON.parse(clave) as typeof items;
    // Sin productos no hace falta preguntar al servidor.
    const pedir = lista.length === 0 ? Promise.resolve(null) : cotizarCarrito(lista, metodoEnvio);
    pedir.then((r) => {
      if (id !== peticion.current) return; // llegó una respuesta vieja
      setCargando(false);
      if (!r) return setCotizacion(null);
      if ("error" in r) return setError(r.error);
      setError(null);
      setCotizacion(r);
      if (r.avisos.length) {
        r.avisos.forEach((a) => toast.warning(a.texto, { id: `aviso-${a.productId}` }));
        sincronizar(r.lineas.map((l) => ({ productId: l.productId, cantidad: l.cantidad })));
      }
    });
  }, [clave, metodoEnvio, montado, sincronizar]);

  return { items, cotizacion: items.length ? cotizacion : null, error, cargando: !montado || (cargando && items.length > 0), montado };
}
