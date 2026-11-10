// Reglas de precio de ITALCOMPU (decisión del dueño, 10-nov-2026). Fuente única para el inventario,
// el panel de productos y los recálculos. Sin "server-only": lo usan también los scripts de la terminal.
//
// - Público:      costo × (1 + utilidad de la categoría %). La categoría puede tener su propia utilidad
//                 (ej. Accesorios 85 %); si no, hereda la de su categoría padre y si no, la general
//                 (Setting `utilidad_publico`, 35 %).
// - Distribuidor: costo × (1 + `utilidad_distribuidor` %) — igual para todas las categorías (25 %).
//                 Nunca más caro que el público.
// - Sin costo (producto creado a mano en el panel o costo 0 en el Excel): se parte del precio público y
//   se deduce el costo con la utilidad de su categoría.
import type { Prisma, PrismaClient } from "@prisma/client";
import { precioDesdeCosto } from "@/lib/precios-calculo";

export const UTILIDAD_PUBLICO_POR_DEFECTO = 35;
export const UTILIDAD_DISTRIBUIDOR_POR_DEFECTO = 25;

type Db = PrismaClient | Prisma.TransactionClient;

/** PVP con IVA → precio sin IVA con 4 decimales (así $15,00 vuelve a mostrarse como $15,00). */
export const pvpASinIva = (pvp: number, iva: number) => Math.round((pvp / (1 + iva / 100)) * 10_000) / 10_000;

const redondear4 = (n: number) => Math.round(n * 10_000) / 10_000;

export type ReglasPrecio = Awaited<ReturnType<typeof leerReglasPrecio>>;

export async function leerReglasPrecio(db: Db) {
  const [filas, categorias] = await Promise.all([
    db.setting.findMany({ where: { clave: { in: ["iva", "utilidad_publico", "utilidad_distribuidor"] } } }),
    db.category.findMany({ select: { id: true, parentId: true, utilidadPublico: true } }),
  ]);
  const valor = (clave: string, porDefecto: number) => {
    const v = filas.find((f) => f.clave === clave)?.valor;
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : porDefecto;
  };
  const iva = valor("iva", 15);
  const utilidadPublico = valor("utilidad_publico", UTILIDAD_PUBLICO_POR_DEFECTO);
  const utilidadDistribuidor = valor("utilidad_distribuidor", UTILIDAD_DISTRIBUIDOR_POR_DEFECTO);
  const porId = new Map(categorias.map((c) => [c.id, c]));

  /** Utilidad para el público de una categoría (propia → padre → general). */
  const utilidadDe = (categoryId: string | null | undefined) => {
    let c = categoryId ? porId.get(categoryId) : undefined;
    for (let saltos = 0; c && saltos < 5; saltos++) {
      if (c.utilidadPublico !== null) return Number(c.utilidadPublico);
      c = c.parentId ? porId.get(c.parentId) : undefined;
    }
    return utilidadPublico;
  };

  /** Precio de distribuidor a partir del público (cuando no hay costo). */
  const distribuidorDesdePublico = (publico: number, categoryId: string | null | undefined) =>
    Math.min(publico, redondear4((publico * (1 + utilidadDistribuidor / 100)) / (1 + utilidadDe(categoryId) / 100)));

  /** Precios sin IVA (público y distribuidor) de un producto. */
  const precios = (categoryId: string | null | undefined, costo: number, pvpConIva: number) => {
    if (costo > 0) {
      const publico = precioDesdeCosto(costo, utilidadDe(categoryId));
      return { publico, distribuidor: Math.min(publico, precioDesdeCosto(costo, utilidadDistribuidor)) };
    }
    const publico = pvpASinIva(pvpConIva, iva);
    return { publico, distribuidor: distribuidorDesdePublico(publico, categoryId) };
  };

  return { iva, utilidadPublico, utilidadDistribuidor, utilidadDe, precios, distribuidorDesdePublico };
}
