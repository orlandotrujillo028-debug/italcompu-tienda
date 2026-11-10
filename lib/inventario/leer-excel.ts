// Lee el Excel de inventario que exporta el sistema contable ("Vista: Inventario").
// El archivo .xls es en realidad XML de Excel 2003 (SpreadsheetML): se lee como texto, sin librerías.
// Sin "server-only": lo usan también los scripts de la terminal.

export type FilaInventario = {
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  stock: number;
  costo: number; // unitario, sin IVA
  pvp: number; // unitario, CON IVA
};

export type InventarioLeido = {
  sucursal: string; // ej. "3 - SUCURSAL SHUSHUFINDI"
  filas: FilaInventario[];
};

export class ErrorInventario extends Error {}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function texto(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ENTIDADES[e])
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Filas de la primera hoja como arreglos de texto (respeta ss:Index de celdas saltadas). */
function filasDeHoja(xml: string): string[][] {
  const hoja = xml.match(/<(?:ss:)?Worksheet\b[\s\S]*?<\/(?:ss:)?Worksheet>/);
  if (!hoja) throw new ErrorInventario("El archivo no tiene hojas de Excel.");
  const filas: string[][] = [];
  for (const fila of hoja[0].matchAll(/<(?:ss:)?Row\b[^>]*>([\s\S]*?)<\/(?:ss:)?Row>/g)) {
    const celdas: string[] = [];
    let i = 0;
    for (const c of fila[1].matchAll(/<(?:ss:)?Cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:ss:)?Cell>)/g)) {
      const indice = c[1].match(/Index="(\d+)"/);
      if (indice) i = Number(indice[1]) - 1;
      const dato = (c[2] ?? "").match(/<(?:ss:)?Data\b[^>]*>([\s\S]*?)<\/(?:ss:)?Data>/);
      celdas[i] = dato ? texto(dato[1]) : "";
      i++;
    }
    filas.push(Array.from(celdas, (v) => v ?? ""));
  }
  return filas;
}

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function numero(valor: string, campo: string, codigo: string): number {
  const n = Number(valor.replace(",", "."));
  if (!Number.isFinite(n)) throw new ErrorInventario(`El producto ${codigo} tiene un ${campo} que no es un número: "${valor}".`);
  return n;
}

/** Convierte el contenido del archivo en filas validadas. Lanza ErrorInventario con un mensaje para el usuario. */
export function leerInventarioExcel(contenido: string): InventarioLeido {
  const inicio = contenido.slice(0, 2000);
  if (inicio.startsWith("PK")) {
    throw new ErrorInventario(
      "Este archivo es .xlsx. Sube el Excel tal como lo exporta el sistema (inventario.xls), sin abrirlo y guardarlo en otro formato.",
    );
  }
  if (!/<Workbook\b/.test(inicio) && !/urn:schemas-microsoft-com:office:spreadsheet/.test(inicio)) {
    throw new ErrorInventario("No se reconoce el archivo. Debe ser el Excel de inventario exportado por el sistema (.xls).");
  }

  const filas = filasDeHoja(contenido);
  const lineaBodega = filas.find((f) => normal(f[0] ?? "").startsWith("bodega:"));
  const sucursal = lineaBodega?.[0].replace(/^bodega:\s*/i, "").trim() || "Sucursal";

  // Encabezado: la fila que tiene "Código", "Stock" y "PVP".
  const iEnc = filas.findIndex((f) => {
    const n = f.map(normal);
    return n.includes("codigo") && n.includes("stock") && n.includes("pvp");
  });
  if (iEnc < 0) throw new ErrorInventario('No se encontró la fila de títulos (Código, Stock, Producto, PVP…). ¿Es la "Vista: Inventario"?');
  const enc = filas[iEnc].map(normal);
  const col = (nombre: string) => {
    const i = enc.indexOf(nombre);
    if (i < 0) throw new ErrorInventario(`Falta la columna "${nombre}" en el Excel.`);
    return i;
  };
  const c = {
    codigo: col("codigo"),
    stock: col("stock"),
    nombre: col("producto"),
    categoria: col("categoria"),
    marca: col("marca"),
    costo: col("costo"),
    pvp: col("pvp"),
  };

  const resultado: FilaInventario[] = [];
  const vistos = new Set<string>();
  for (const f of filas.slice(iEnc + 1)) {
    const codigo = (f[c.codigo] ?? "").trim();
    if (!codigo || normal(codigo) === "totales") continue; // fila de totales o pie ("Productos: 484")
    if (vistos.has(codigo)) throw new ErrorInventario(`El código ${codigo} aparece dos veces en el Excel.`);
    vistos.add(codigo);
    const fila: FilaInventario = {
      codigo,
      nombre: (f[c.nombre] ?? "").trim() || codigo,
      categoria: (f[c.categoria] ?? "").trim(),
      marca: (f[c.marca] ?? "").trim(),
      stock: numero(f[c.stock] ?? "0", "stock", codigo),
      costo: numero(f[c.costo] || "0", "costo", codigo),
      pvp: numero(f[c.pvp] || "0", "PVP", codigo),
    };
    if (fila.pvp < 0 || fila.costo < 0) throw new ErrorInventario(`El producto ${codigo} tiene un precio negativo.`);
    resultado.push(fila);
  }
  if (resultado.length === 0) throw new ErrorInventario("El Excel no tiene productos.");
  return { sucursal, filas: resultado };
}
