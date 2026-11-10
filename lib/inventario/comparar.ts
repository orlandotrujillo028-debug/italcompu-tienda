// Compara dos cargas de inventario (la actual contra la anterior de la misma sucursal).
// Cálculo puro: recibe los ítems ya leídos de la base.

export type ItemComparable = { codigo: string; nombre: string; categoria: string; stock: number; costo: number; pvp: number };

export type Cambio = {
  codigo: string;
  nombre: string;
  categoria: string;
  stockAntes: number;
  stockAhora: number;
  pvpAntes: number;
  pvpAhora: number;
  costoAntes: number;
  costoAhora: number;
};

export type Comparacion = {
  nuevos: ItemComparable[]; // están ahora y no estaban antes (llegaron)
  retirados: ItemComparable[]; // estaban antes y ya no están (se vendió todo o se dio de baja)
  subeStock: Cambio[];
  bajaStock: Cambio[];
  cambioPrecio: Cambio[]; // cambió el PVP
  cambioCosto: Cambio[]; // cambió el costo (sin cambio de PVP: revisar margen)
  sinCambios: number;
};

// Tolerancias: los valores del sistema contable traen muchos decimales (3,66086956521739).
const igual = (a: number, b: number, tol: number) => Math.abs(a - b) < tol;

export function compararCargas(actual: ItemComparable[], anterior: ItemComparable[]): Comparacion {
  const antes = new Map(anterior.map((i) => [i.codigo, i]));
  const ahora = new Set(actual.map((i) => i.codigo));
  const r: Comparacion = { nuevos: [], retirados: [], subeStock: [], bajaStock: [], cambioPrecio: [], cambioCosto: [], sinCambios: 0 };

  for (const i of actual) {
    const a = antes.get(i.codigo);
    if (!a) {
      r.nuevos.push(i);
      continue;
    }
    const c: Cambio = {
      codigo: i.codigo,
      nombre: i.nombre,
      categoria: i.categoria,
      stockAntes: a.stock,
      stockAhora: i.stock,
      pvpAntes: a.pvp,
      pvpAhora: i.pvp,
      costoAntes: a.costo,
      costoAhora: i.costo,
    };
    let cambio = false;
    if (!igual(i.stock, a.stock, 0.0005)) {
      (i.stock > a.stock ? r.subeStock : r.bajaStock).push(c);
      cambio = true;
    }
    if (!igual(i.pvp, a.pvp, 0.005)) {
      r.cambioPrecio.push(c);
      cambio = true;
    } else if (!igual(i.costo, a.costo, 0.005)) {
      r.cambioCosto.push(c);
      cambio = true;
    }
    if (!cambio) r.sinCambios++;
  }
  for (const a of anterior) if (!ahora.has(a.codigo)) r.retirados.push(a);

  const porNombre = (x: { nombre: string }, y: { nombre: string }) => x.nombre.localeCompare(y.nombre, "es");
  r.nuevos.sort(porNombre);
  r.retirados.sort(porNombre);
  r.subeStock.sort((x, y) => y.stockAhora - y.stockAntes - (x.stockAhora - x.stockAntes));
  r.bajaStock.sort((x, y) => x.stockAhora - x.stockAntes - (y.stockAhora - y.stockAntes));
  r.cambioPrecio.sort(porNombre);
  r.cambioCosto.sort(porNombre);
  return r;
}
