import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { esDistribuidorAprobado, getUsuarioActual } from "@/lib/auth-guards";
import { descuentoPorUtilidades, type Tarifa } from "@/lib/precios-calculo";
import { UTILIDAD_DISTRIBUIDOR_POR_DEFECTO, UTILIDAD_PUBLICO_POR_DEFECTO } from "@/lib/inventario/reglas-precio";

export { calcularPrecio, type Tarifa } from "@/lib/precios-calculo";
export { UTILIDAD_DISTRIBUIDOR_POR_DEFECTO, UTILIDAD_PUBLICO_POR_DEFECTO };

/**
 * Precios de ITALCOMPU (decisión del dueño, 10-nov-2026) — reglas en `lib/inventario/reglas-precio.ts`.
 * - Cada producto guarda `precioSinIva` (público) y `precioDistribuidorSinIva`, calculados desde el costo.
 * - Público = costo + utilidad de su categoría (general 35 %); distribuidor = costo + 25 %.
 * - Siempre se decide en el SERVIDOR qué tarifa le toca a cada usuario.
 */

/** IVA y utilidades desde la tabla Setting (una sola consulta por petición). */
export const getConfigPrecios = cache(async () => {
  const [filas, maxCategoria] = await Promise.all([
    prisma.setting.findMany({ where: { clave: { in: ["iva", "utilidad_publico", "utilidad_distribuidor"] } } }),
    prisma.category.aggregate({ where: { activa: true }, _max: { utilidadPublico: true } }),
  ]);
  const valor = (clave: string, porDefecto: number) => {
    const v = filas.find((f) => f.clave === clave)?.valor;
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : porDefecto;
  };
  const utilidadPublico = valor("utilidad_publico", UTILIDAD_PUBLICO_POR_DEFECTO);
  const utilidadDistribuidor = valor("utilidad_distribuidor", UTILIDAD_DISTRIBUIDOR_POR_DEFECTO);
  const utilidadMaxima = Math.max(utilidadPublico, Number(maxCategoria._max.utilidadPublico ?? 0));
  return {
    iva: valor("iva", 15),
    utilidadPublico,
    utilidadDistribuidor,
    /** El mayor descuento que ve un distribuidor (en la categoría de más utilidad), para los textos "hasta X %". */
    descuentoMaximo: descuentoPorUtilidades(utilidadMaxima, utilidadDistribuidor),
  };
});

/** Qué precios le tocan al visitante actual: público o distribuidor. */
export const getTarifa = cache(async (): Promise<Tarifa> => {
  const [usuario, config] = await Promise.all([getUsuarioActual(), getConfigPrecios()]);
  return { iva: config.iva, esDistribuidor: esDistribuidorAprobado(usuario) };
});
