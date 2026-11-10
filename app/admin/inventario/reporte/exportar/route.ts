import { NextResponse, type NextRequest } from "next/server";
import { getUsuarioActual } from "@/lib/auth-guards";
import { celdaCsv, numeroCsv, respuestaCsv } from "@/lib/csv";
import { generarReporte, leerOpciones, type FilaReporte } from "@/lib/inventario/reporte";

const LISTAS = ["reponer", "margenes", "sin-movimiento", "capital"] as const;
type Lista = (typeof LISTAS)[number];

/** GET /admin/inventario/reporte/exportar?lista=reponer&minimo=1&margen=15 → CSV (solo ADMIN). */
export async function GET(req: NextRequest) {
  const usuario = await getUsuarioActual();
  if (usuario?.rol !== "ADMIN") return new NextResponse("No autorizado", { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const lista = (LISTAS as readonly string[]).includes(sp.lista) ? (sp.lista as Lista) : "reponer";
  const r = await generarReporte(leerOpciones(sp));
  if (!r) return new NextResponse("Todavía no se ha subido ningún inventario.", { status: 404 });

  const base = (f: FilaReporte) => [celdaCsv(f.codigo), celdaCsv(f.nombre), celdaCsv(f.categoria), numeroCsv(f.stock, 3)];
  const precios = (f: FilaReporte) => [numeroCsv(f.costo, 4), numeroCsv(f.pvp), numeroCsv(f.margen * 100, 1)];
  const enc = ["Código", "Producto", "Categoría (sistema)", "Stock"];
  const encPrecios = ["Costo unitario sin IVA", "PVP con IVA", "Margen %"];

  let encabezado: string[];
  let filas: string[][];
  if (lista === "reponer") {
    encabezado = [...enc, "Stock carga anterior", "Situación", ...encPrecios];
    filas = [
      ...r.agotados.map((f) => [...base(f), numeroCsv(f.stockAnterior ?? 0, 3), "Agotado (ya no está en el Excel)", ...precios(f)]),
      ...r.stockBajo.map((f) => [...base(f), f.stockAnterior === null ? "" : numeroCsv(f.stockAnterior, 3), "Stock bajo", ...precios(f)]),
    ];
  } else if (lista === "margenes") {
    encabezado = [...enc, ...encPrecios, "PVP sin IVA", "Ganancia por unidad"];
    filas = [...r.pierden, ...r.margenBajo].map((f) => [...base(f), ...precios(f), numeroCsv(f.pvpSinIva, 4), numeroCsv(f.pvpSinIva - f.costo, 4)]);
  } else if (lista === "sin-movimiento") {
    encabezado = [...enc, "Días sin movimiento", "Capital a costo", ...encPrecios];
    filas = r.sinMovimiento.map((f) => [...base(f), String(f.diasSinMovimiento ?? 0), numeroCsv(f.capital), ...precios(f)]);
  } else {
    encabezado = [...enc, "Capital a costo", "% del total", ...encPrecios];
    filas = r.capital.map((f) => [...base(f), numeroCsv(f.capital), numeroCsv((f.capital / (r.resumen.totalCosto || 1)) * 100, 1), ...precios(f)]);
  }

  const fecha = new Date(r.carga.createdAt.getTime() - 5 * 3600_000).toISOString().slice(0, 10); // fecha de Ecuador
  return respuestaCsv(`inventario-${lista}-${fecha}.csv`, encabezado, filas);
}
