"use server";

import { z } from "zod";
import { cotizar, type Cotizacion } from "@/lib/pedido";
import { getTarifa } from "@/lib/precios";
import { itemsCarritoSchema, METODOS_ENVIO } from "@/lib/validaciones/pedido";

/** Precios, stock y totales del carrito según quién está comprando (público o distribuidor). */
export async function cotizarCarrito(items: unknown, metodoEnvio: unknown = "DOMICILIO"): Promise<Cotizacion | { error: string }> {
  const v = itemsCarritoSchema.safeParse(items);
  const envio = z.enum(METODOS_ENVIO).catch("DOMICILIO").parse(metodoEnvio);
  if (!v.success) return { error: "No pudimos leer tu carrito. Intenta de nuevo." };
  return cotizar(v.data, await getTarifa(), envio);
}
