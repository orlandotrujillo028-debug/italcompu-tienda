// Cálculo puro de precios (sin base de datos ni sesión).
// Se puede usar en el servidor y también en formularios del navegador (vista previa).

export type Tarifa = { iva: number; esDistribuidor: boolean; descuento: number };

// Redondeo a centavos "hacia arriba desde 0,5" (14,375 → 14,38).
// toPrecision corrige errores de coma flotante (14,375 × 100 = 1437,4999…).
const redondear = (n: number) => Math.round(Number((n * 100).toPrecision(12))) / 100;

/**
 * Precio de un producto para una tarifa.
 * El descuento de distribuidor se aplica ANTES del IVA.
 */
export function calcularPrecio(precioSinIva: number | { toString(): string }, tarifa: Tarifa) {
  const base = Number(precioSinIva);
  const publicoConIva = redondear(base * (1 + tarifa.iva / 100));
  const sinIva = redondear(base * (1 - tarifa.descuento / 100));
  const conIva = redondear(sinIva * (1 + tarifa.iva / 100));
  return {
    sinIva, // lo que se guarda en el pedido
    conIva, // lo que se muestra y se cobra
    publicoConIva, // para mostrar tachado al distribuidor
    ahorro: redondear(publicoConIva - conIva),
  };
}
