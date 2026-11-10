// Lee el Excel de inventario que exporta el sistema contable ("Vista: Inventario").
// Acepta los dos formatos que entrega el sistema, sin librerías:
// - .xls: en realidad es XML de Excel 2003 (SpreadsheetML) y se lee como texto.
// - .xlsx: un ZIP con XML adentro (se descomprime con zlib de Node). Se lee la primera hoja.
// Sin "server-only": lo usan también los scripts de la terminal.
import { inflateRawSync } from "node:zlib";

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

/** Archivos de un ZIP (nombre → contenido). Solo lo necesario para leer un .xlsx. */
function abrirZip(zip: Buffer): Map<string, Buffer> {
  // El "directorio central" está al final del archivo: se busca su firma desde atrás.
  let fin = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new ErrorInventario("El archivo .xlsx está dañado o incompleto.");
  const total = zip.readUInt16LE(fin + 10);
  let p = zip.readUInt32LE(fin + 16);
  const archivos = new Map<string, Buffer>();
  for (let n = 0; n < total; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new ErrorInventario("El archivo .xlsx está dañado.");
    const metodo = zip.readUInt16LE(p + 10);
    const tamano = zip.readUInt32LE(p + 20);
    const largoNombre = zip.readUInt16LE(p + 28);
    const local = zip.readUInt32LE(p + 42);
    const nombre = zip.toString("utf8", p + 46, p + 46 + largoNombre);
    p += 46 + largoNombre + zip.readUInt16LE(p + 30) + zip.readUInt16LE(p + 32);
    const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const datos = zip.subarray(inicio, inicio + tamano);
    if (metodo === 0) archivos.set(nombre, datos);
    else if (metodo === 8) archivos.set(nombre, inflateRawSync(datos));
  }
  return archivos;
}

/** "AB" → 27 (índice desde 0). */
const indiceColumna = (letras: string) => [...letras].reduce((n, l) => n * 26 + l.charCodeAt(0) - 64, 0) - 1;

/** Filas de la primera hoja de un .xlsx como arreglos de texto. */
function filasDeXlsx(zip: Buffer): string[][] {
  const archivos = abrirZip(zip);
  const leer = (nombre: string) => archivos.get(nombre)?.toString("utf8");
  // La primera hoja según el libro (no siempre se llama sheet1.xml).
  const rid = (leer("xl/workbook.xml") ?? "").match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  const relacion = [...(leer("xl/_rels/workbook.xml.rels") ?? "").matchAll(/<Relationship\b[^>]*>/g)].find((r) => r[0].includes(`Id="${rid}"`));
  const destino = relacion?.[0].match(/Target="([^"]+)"/)?.[1];
  const ruta = destino ? (destino.startsWith("/") ? destino.slice(1) : `xl/${destino}`) : "xl/worksheets/sheet1.xml";
  const hoja = leer(ruta);
  if (!hoja) throw new ErrorInventario("El archivo .xlsx no tiene hojas.");
  const compartidos = [...(leer("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    texto(m[1].replace(/<rPh\b[\s\S]*?<\/rPh>/g, "")),
  );
  const filas: string[][] = [];
  for (const fila of hoja.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const celdas: string[] = [];
    let i = 0;
    for (const c of fila[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = c[1].match(/\br="([A-Z]+)\d+"/);
      if (ref) i = indiceColumna(ref[1]);
      const tipo = c[1].match(/\bt="(\w+)"/)?.[1];
      const cuerpo = c[2] ?? "";
      const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      celdas[i] = tipo === "s" ? (compartidos[Number(v)] ?? "") : tipo === "inlineStr" ? texto(cuerpo) : texto(v);
      i++;
    }
    filas.push(Array.from(celdas, (v) => v ?? ""));
  }
  return filas;
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
export function leerInventarioExcel(datos: Buffer): InventarioLeido {
  let filas: string[][];
  if (datos.subarray(0, 2).toString("latin1") === "PK") {
    filas = filasDeXlsx(datos); // .xlsx
  } else {
    const contenido = datos.toString("utf8");
    const inicio = contenido.slice(0, 2000);
    if (!/<Workbook\b/.test(inicio) && !/urn:schemas-microsoft-com:office:spreadsheet/.test(inicio)) {
      throw new ErrorInventario("No se reconoce el archivo. Debe ser el Excel de inventario exportado por el sistema (.xls o .xlsx).");
    }
    filas = filasDeHoja(contenido);
  }

  // Encabezado: la fila que tiene "Código" y "PVP". El stock viene como "Stock" o con el nombre
  // de la sucursal ("3 - SUCURSAL SHUSHUFINDI"), según cómo se exporte.
  const esColumnaStock = (t: string) => t === "stock" || /^\d+\s*-\s*\S/.test(t) || t.includes("sucursal") || t.includes("bodega");
  const iEnc = filas.findIndex((f) => {
    const n = f.map(normal);
    return n.includes("codigo") && n.includes("pvp") && n.some(esColumnaStock);
  });
  if (iEnc < 0) throw new ErrorInventario('No se encontró la fila de títulos (Código, Stock, Producto, PVP…). ¿Es la "Vista: Inventario"?');
  const enc = filas[iEnc].map(normal);
  const col = (nombre: string) => {
    const i = enc.indexOf(nombre);
    if (i < 0) throw new ErrorInventario(`Falta la columna "${nombre}" en el Excel.`);
    return i;
  };
  const iStock = enc.includes("stock") ? enc.indexOf("stock") : enc.findIndex(esColumnaStock);
  const lineaBodega = filas.find((f) => normal(f[0] ?? "").startsWith("bodega:"));
  const sucursal =
    lineaBodega?.[0].replace(/^bodega:\s*/i, "").trim() || (enc[iStock] !== "stock" ? filas[iEnc][iStock].trim() : "") || "Sucursal";
  const c = {
    codigo: col("codigo"),
    stock: iStock,
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
