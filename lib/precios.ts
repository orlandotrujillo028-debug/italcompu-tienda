import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { esDistribuidorAprobado, getUsuarioActual } from "@/lib/auth-guards";
import type { Tarifa } from "@/lib/precios-calculo";

export { calcularPrecio, type Tarifa } from "@/lib/precios-calculo";

/**
 * Precios de ITALCOMPU
 * - En la base se guarda `precioSinIva` (precio público sin IVA).
 * - Distribuidor aprobado: se aplica el % "descuento_distribuidor" (Configuración) ANTES del IVA.
 * - Siempre se decide en el SERVIDOR qué tarifa le toca a cada usuario.
 */

/** IVA y descuento de distribuidor desde la tabla Setting (una sola consulta por petición). */
export const getConfigPrecios = cache(async () => {
  const filas = await prisma.setting.findMany({ where: { clave: { in: ["iva", "descuento_distribuidor"] } } });
  const valor = (clave: string, porDefecto: number) => {
    const n = Number(filas.find((f) => f.clave === clave)?.valor);
    return Number.isFinite(n) && n >= 0 ? n : porDefecto;
  };
  return {
    iva: valor("iva", 15),
    descuentoDistribuidor: Math.min(valor("descuento_distribuidor", 0), 90),
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
