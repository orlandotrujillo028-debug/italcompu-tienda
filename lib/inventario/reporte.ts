import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Informe de gestión del inventario de la sucursal (última carga subida):
 * - Por reponer: productos que se AGOTARON desde la carga anterior (tenían stock y ahora vienen con 0
 *   o ya no vienen en el Excel) + stock bajo (más de 0 y hasta el mínimo). Los que ya estaban en 0
 *   (o llegaron sin unidades) van aparte en "Sin stock".
 * - Márgenes: con el PRECIO DE LA TIENDA (costo + utilidad, redondeado), no con el PVP del Excel.
 * - Sin movimiento: mismo stock durante al menos N días según el historial de cargas (mercadería quieta).
 * - Capital: dónde está invertido el dinero (costo × stock).
 *
 * Margen = (precio tienda sin IVA − costo) / precio tienda sin IVA. Si el producto no existe en la tienda,
 * se usa el PVP del Excel (incluye IVA). El costo nunca incluye IVA.
 */

export type FilaReporte = {
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockAnterior: number | null; // en la carga anterior (null = no estaba)
  costo: number;
  pvp: number; // precio de la TIENDA con IVA (o PVP del Excel si no está en la tienda)
  pvpSinIva: number;
  motivo?: string; // en "agotados": por qué
  margen: number; // 0,25 = 25 %
  capital: number; // costo × stock
  diasSinMovimiento?: number;
  igualDesde?: Date;
};

export type OpcionesReporte = { stockMinimo: number; margenMinimo: number /* % */; diasSinMovimiento: number };

export const OPCIONES_POR_DEFECTO: OpcionesReporte = { stockMinimo: 1, margenMinimo: 15, diasSinMovimiento: 30 };

export async function generarReporte(op: OpcionesReporte) {
  const ultima = await prisma.inventarioCarga.findFirst({ orderBy: { createdAt: "desc" } });
  if (!ultima) return null;

  // Todas las cargas de la sucursal (solo id y fecha: es liviano).
  const cargas = await prisma.inventarioCarga.findMany({
    where: { sucursal: ultima.sucursal },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  const [ivaFila, items, cambios, productos] = await Promise.all([
    prisma.setting.findUnique({ where: { clave: "iva" } }),
    prisma.inventarioItem.findMany({
      where: { cargaId: { in: cargas.slice(0, 2).map((c) => c.id) } }, // la actual y la anterior
      select: { cargaId: true, codigo: true, nombre: true, categoria: true, stock: true, costo: true, pvp: true },
    }),
    // Para cada producto actual: la carga MÁS RECIENTE (anterior a la actual) en la que su stock era
    // distinto o no estaba. Desde la carga siguiente a esa, el stock no se ha movido.
    prisma.$queryRaw<{ codigo: string; ultimoCambio: Date | null }[]>`
      SELECT a."codigo",
        (SELECT max(c."createdAt") FROM "InventarioCarga" c
          WHERE c."sucursal" = ${ultima.sucursal} AND c."createdAt" < ${ultima.createdAt}
            AND NOT EXISTS (SELECT 1 FROM "InventarioItem" i
              WHERE i."cargaId" = c."id" AND i."codigo" = a."codigo" AND i."stock" = a."stock")) AS "ultimoCambio"
      FROM "InventarioItem" a WHERE a."cargaId" = ${ultima.id}`,
    // Precio público actual de la tienda (sin IVA) de cada producto.
    prisma.product.findMany({ select: { codigo: true, precioSinIva: true } }),
  ]);
  const precioTienda = new Map(productos.map((p) => [p.codigo, Number(p.precioSinIva)]));
  const iva = Number.isFinite(Number(ivaFila?.valor)) ? Number(ivaFila?.valor) : 15;

  // Stock de cada producto en la carga actual (0) y la anterior (1).
  const stockPor = cargas.slice(0, 2).map((c) => new Map(items.filter((i) => i.cargaId === c.id).map((i) => [i.codigo, Number(i.stock)])));
  const anterior = cargas[1] ? items.filter((i) => i.cargaId === cargas[1].id) : [];

  const aFila = (i: (typeof items)[number], stockActual: number | null): FilaReporte => {
    const stock = stockActual ?? Number(i.stock);
    const costo = Number(i.costo);
    const tienda = precioTienda.get(i.codigo);
    const pvpSinIva = tienda !== undefined && tienda > 0 ? tienda : Number(i.pvp) / (1 + iva / 100);
    const pvp = Math.round(pvpSinIva * (1 + iva / 100) * 100) / 100;
    return {
      codigo: i.codigo,
      nombre: i.nombre,
      categoria: i.categoria,
      stock,
      stockAnterior: stockPor[1]?.get(i.codigo) ?? null,
      costo,
      pvp,
      pvpSinIva,
      margen: pvpSinIva > 0 ? (pvpSinIva - costo) / pvpSinIva : -1,
      capital: costo * Math.max(stock, 0),
    };
  };

  const actuales = items.filter((i) => i.cargaId === ultima.id).map((i) => aFila(i, null));
  const porNombre = (a: FilaReporte, b: FilaReporte) => a.nombre.localeCompare(b.nombre, "es");
  const vendido = (f: FilaReporte) => (f.stockAnterior ?? f.stock) - f.stock;

  // Por reponer
  // Se agotaron = en la carga anterior tenían stock y ahora vienen con 0 o ya no vienen en el Excel.
  const actualesPorCodigo = new Map(actuales.map((f) => [f.codigo, f]));
  const agotados = anterior
    .filter((i) => Number(i.stock) > 0)
    .flatMap((i) => {
      const ahora = actualesPorCodigo.get(i.codigo);
      if (!ahora) return [{ ...aFila(i, 0), motivo: "Ya no viene en el Excel" }];
      return ahora.stock <= 0 ? [{ ...ahora, motivo: "Ahora con stock 0" }] : [];
    })
    .sort(porNombre);
  const codigosAgotados = new Set(agotados.map((f) => f.codigo));
  const stockBajo = actuales
    .filter((f) => f.stock > 0 && f.stock <= op.stockMinimo)
    .sort((a, b) => vendido(b) - vendido(a) || a.stock - b.stock || porNombre(a, b));
  // Sin stock que NO se agotó ahora: ya estaba en 0 o llegó al Excel sin unidades.
  const sinStock = actuales.filter((f) => f.stock <= 0 && !codigosAgotados.has(f.codigo)).sort(porNombre);

  // Márgenes
  const pierden = actuales.filter((f) => f.margen < 0).sort((a, b) => a.margen - b.margen);
  const margenBajo = actuales.filter((f) => f.margen >= 0 && f.margen < op.margenMinimo / 100).sort((a, b) => a.margen - b.margen);

  // Sin movimiento: mismo stock desde hace al menos `diasSinMovimiento` días.
  const fechasAsc = cargas.map((c) => c.createdAt).sort((a, b) => a.getTime() - b.getTime());
  const ultimoCambio = new Map(cambios.map((c) => [c.codigo, c.ultimoCambio]));
  const dias = (desde: Date) => Math.floor((ultima.createdAt.getTime() - desde.getTime()) / 86_400_000);
  const historialDias = dias(fechasAsc[0]);
  const sinMovimiento: FilaReporte[] = [];
  for (const f of actuales) {
    const cambio = ultimoCambio.get(f.codigo);
    // Igual desde la primera carga posterior al último cambio (o desde la primera carga si nunca cambió).
    const desde = cambio ? fechasAsc.find((d) => d.getTime() > new Date(cambio).getTime()) : fechasAsc[0];
    if (!desde) continue;
    const d = dias(desde);
    if (d >= op.diasSinMovimiento && d > 0) sinMovimiento.push({ ...f, igualDesde: desde, diasSinMovimiento: d });
  }
  sinMovimiento.sort((a, b) => (b.diasSinMovimiento ?? 0) - (a.diasSinMovimiento ?? 0) || b.capital - a.capital);

  // Capital
  const capital = [...actuales].sort((a, b) => b.capital - a.capital);
  const totalCosto = actuales.reduce((s, f) => s + f.capital, 0);
  const totalVenta = actuales.reduce((s, f) => s + f.pvpSinIva * Math.max(f.stock, 0), 0);

  return {
    carga: ultima,
    anterior: cargas[1] ?? null,
    cargasComparadas: cargas.length,
    historialDias,
    iva,
    resumen: {
      productos: actuales.length,
      unidades: actuales.reduce((s, f) => s + f.stock, 0),
      totalCosto,
      totalVenta, // a precio de la tienda sin IVA
      gananciaPotencial: totalVenta - totalCosto,
      margenPromedio: totalVenta > 0 ? (totalVenta - totalCosto) / totalVenta : 0,
      porReponer: stockBajo.length + agotados.length,
      pierden: pierden.length,
    },
    agotados,
    stockBajo,
    sinStock,
    pierden,
    margenBajo,
    sinMovimiento,
    capital,
  };
}

export type Reporte = NonNullable<Awaited<ReturnType<typeof generarReporte>>>;

/** Lee los filtros de la URL con límites razonables. */
export function leerOpciones(sp: { minimo?: string; margen?: string; dias?: string }): OpcionesReporte {
  const n = (v: string | undefined, def: number, min: number, max: number) => {
    const x = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(x) ? Math.min(Math.max(x, min), max) : def;
  };
  return {
    stockMinimo: n(sp.minimo, OPCIONES_POR_DEFECTO.stockMinimo, 0, 1000),
    margenMinimo: n(sp.margen, OPCIONES_POR_DEFECTO.margenMinimo, 0, 100),
    diasSinMovimiento: Math.round(n(sp.dias, OPCIONES_POR_DEFECTO.diasSinMovimiento, 1, 3650)),
  };
}
