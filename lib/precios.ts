import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { esDistribuidorAprobado, getUsuarioActual } from "@/lib/auth-guards";
import { descuentoPorUtilidades, type Tarifa } from "@/lib/precios-calculo";

export { calcularPrecio, type Tarifa } from "@/lib/precios-calculo";

/**
 * Precios de ITALCOMPU (decisión del dueño, 10-nov-2026)
 * - Precio público = costo + `utilidad_publico` % (por defecto 35 %), + IVA.
 * - Distribuidor aprobado = costo + `utilidad_distribuidor` % (por defecto 25 %), + IVA.
 * - En la base se guarda `precioSinIva` (público, sin IVA; se calcula del costo al aplicar el inventario).
 *   Al distribuidor se le baja el precio público en el % equivalente (`descuentoPorUtilidades`).
 * - Siempre se decide en el SERVIDOR qué tarifa le toca a cada usuario.
 */

export const UTILIDAD_PUBLICO_POR_DEFECTO = 35;
export const UTILIDAD_DISTRIBUIDOR_POR_DEFECTO = 25;

/** IVA y utilidades desde la tabla Setting (una sola consulta por petición). */
export const getConfigPrecios = cache(async () => {
  const filas = await prisma.setting.findMany({ where: { clave: { in: ["iva", "utilidad_publico", "utilidad_distribuidor"] } } });
  const valor = (clave: string, porDefecto: number) => {
    const n = Number(filas.find((f) => f.clave === clave)?.valor);
    return Number.isFinite(n) && n >= 0 && filas.some((f) => f.clave === clave && f.valor !== "") ? n : porDefecto;
  };
  const utilidadPublico = valor("utilidad_publico", UTILIDAD_PUBLICO_POR_DEFECTO);
  const utilidadDistribuidor = valor("utilidad_distribuidor", UTILIDAD_DISTRIBUIDOR_POR_DEFECTO);
  return {
    iva: valor("iva", 15),
    utilidadPublico,
    utilidadDistribuidor,
    descuentoDistribuidor: descuentoPorUtilidades(utilidadPublico, utilidadDistribuidor),
  };
});

/** Qué precios le tocan al visitante actual: público o distribuidor. */
export const getTarifa = cache(async (): Promise<Tarifa> => {
  const [usuario, config] = await Promise.all([getUsuarioActual(), getConfigPrecios()]);
  const esDistribuidor = esDistribuidorAprobado(usuario);
  return {
    iva: config.iva,
    esDistribuidor,
    descuento: esDistribuidor ? config.descuentoDistribuidor : 0,
  };
});
