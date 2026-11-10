// Cálculo puro de precios (sin base de datos ni sesión).
// Se puede usar en el servidor y también en formularios del navegador (vista previa).

export type Tarifa = { iva: number; esDistribuidor: boolean };

// Redondeo a centavos "hacia arriba desde 0,5" (14,375 → 14,38).
// toPrecision corrige errores de coma flotante (14,375 × 100 = 1437,4999…).
const redondear = (n: number) => Math.round(Number((n * 100).toPrecision(12))) / 100;

/**
 * Precio público SIN IVA a partir del costo (sin IVA) y la utilidad para el público.
 * Utilidad sobre el costo: costo $10 + 35 % = $13,50 sin IVA → $15,53 con IVA.
 * 4 decimales, igual que `Product.precioSinIva`.
 */
export const precioDesdeCosto = (costo: number, utilidadPublico: number) =>
  Math.round(costo * (1 + utilidadPublico / 100) * 10_000) / 10_000;

/**
 * % que baja el precio público para que el distribuidor pague costo + su utilidad.
 * Con 35 % público y 25 % distribuidor: 1 − 1,25 ÷ 1,35 = 7,407… % (se guarda sin redondear
 * para que el precio de distribuidor dé exactamente costo × 1,25).
 */
export function descuentoPorUtilidades(utilidadPublico: number, utilidadDistribuidor: number) {
  if (utilidadDistribuidor >= utilidadPublico) return 0;
  return (1 - (1 + utilidadDistribuidor / 100) / (1 + utilidadPublico / 100)) * 100;
}

type Num = number | { toString(): string };
/** Los dos precios guardados de un producto (sin IVA). */
export type PreciosProducto = { precioSinIva: Num; precioDistribuidorSinIva?: Num | null };

/**
 * Precio de un producto para una tarifa.
 * - Recibe los dos precios del producto; el distribuidor paga `precioDistribuidorSinIva` (nunca más que el público).
 * - Si solo se pasa un número, es el precio público (y lo paga cualquiera).
 */
export function calcularPrecio(producto: Num | PreciosProducto, tarifa: Tarifa) {
  const p: PreciosProducto = typeof producto === "object" && "precioSinIva" in producto ? producto : { precioSinIva: producto };
  const base = Number(p.precioSinIva);
  const publicoConIva = redondear(base * (1 + tarifa.iva / 100));
  const distribuidor = p.precioDistribuidorSinIva == null ? base : Math.min(base, Number(p.precioDistribuidorSinIva));
  const sinIvaExacto = tarifa.esDistribuidor ? distribuidor : base;
  const sinIva = redondear(sinIvaExacto);
  // Se calcula desde el valor SIN redondear: un PVP de $15,00 guardado como 13,0435 sin IVA
  // vuelve a dar $15,00 (redondeando primero a 13,04 daría $15,00 pero $0,50 daría $0,49).
  const conIva = redondear(sinIvaExacto * (1 + tarifa.iva / 100));
  return {
    sinIva, // lo que se guarda en el pedido
    conIva, // lo que se muestra y se cobra
    publicoConIva, // para mostrar tachado al distribuidor
    ahorro: redondear(publicoConIva - conIva),
  };
}
