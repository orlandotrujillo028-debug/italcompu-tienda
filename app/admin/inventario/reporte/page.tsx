import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Download, PackageSearch, PiggyBank, Snail, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { generarReporte, leerOpciones, type FilaReporte } from "@/lib/inventario/reporte";

export const metadata: Metadata = { title: "Reporte de inventario" };

type Props = { searchParams: Promise<{ minimo?: string; margen?: string; dias?: string }> };

const MAX_FILAS = 100; // en pantalla; el Excel trae todas
const num = (n: number) => n.toLocaleString("es-EC", { maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toLocaleString("es-EC", { maximumFractionDigits: 1 })} %`;

export default async function ReporteInventarioPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const op = leerOpciones(sp);
  const r = await generarReporte(op);
  const exportar = (lista: string) => `/admin/inventario/reporte/exportar?lista=${lista}&minimo=${op.stockMinimo}&margen=${op.margenMinimo}&dias=${op.diasSinMovimiento}`;

  if (!r) {
    return (
      <div className="space-y-4">
        <Volver />
        <h1 className="text-2xl font-bold text-marca-navy">Reporte de inventario</h1>
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-marca-gris">
          Todavía no se ha subido ningún inventario. <Link href="/admin/inventario" className="text-marca-azul underline">Subir el primero</Link>
        </p>
      </div>
    );
  }

  const { resumen } = r;
  const colMargen: Columna = {
    titulo: "Margen",
    valor: (f) => (
      <span className={f.margen < 0 ? "font-semibold text-red-700" : f.margen < op.margenMinimo / 100 ? "font-semibold text-amber-800" : ""}>{pct(f.margen)}</span>
    ),
  };
  const colCosto: Columna = { titulo: "Costo", valor: (f) => formatoUSD(f.costo) };
  const colPvp: Columna = { titulo: "PVP", valor: (f) => formatoUSD(f.pvp) };

  return (
    <div className="space-y-6">
      <Volver />
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-marca-navy">Reporte de inventario</h1>
        <p className="text-sm text-marca-gris">
          {r.carga.sucursal} · inventario del {fechaEC(r.carga.createdAt, "conHora")}
          {r.anterior ? ` · comparado con el del ${fechaEC(r.anterior.createdAt, "conHora")}` : ""}
        </p>
      </header>

      {/* Ajustes */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 text-sm">
        <label className="space-y-1">
          <span className="block font-medium text-marca-navy">Reponer si el stock es ≤</span>
          <input name="minimo" type="number" min={0} max={1000} step={1} defaultValue={op.stockMinimo} className="h-9 w-28 rounded-md border px-2" />
        </label>
        <label className="space-y-1">
          <span className="block font-medium text-marca-navy">Margen mínimo aceptable (%)</span>
          <input name="margen" type="number" min={0} max={100} step={1} defaultValue={op.margenMinimo} className="h-9 w-28 rounded-md border px-2" />
        </label>
        <label className="space-y-1">
          <span className="block font-medium text-marca-navy">Sin movimiento desde hace (días)</span>
          <input name="dias" type="number" min={1} max={3650} step={1} defaultValue={op.diasSinMovimiento} className="h-9 w-28 rounded-md border px-2" />
        </label>
        <Button type="submit" variant="outline">Actualizar</Button>
      </form>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Dato titulo="Capital a costo" valor={formatoUSD(resumen.totalCosto)} nota={`${resumen.productos} productos · ${num(resumen.unidades)} u.`} />
        <Dato titulo="Venta potencial (sin IVA)" valor={formatoUSD(resumen.totalVenta)} nota="si se vende todo a PVP" />
        <Dato titulo="Ganancia potencial" valor={formatoUSD(resumen.gananciaPotencial)} nota={`margen promedio ${pct(resumen.margenPromedio)}`} />
        <Dato titulo="Por reponer" valor={String(resumen.porReponer)} nota={`stock ≤ ${op.stockMinimo} o agotados`} alerta={resumen.porReponer > 0} href="#reponer" />
        <Dato titulo="Bajo el costo" valor={String(resumen.pierden)} nota="se venden perdiendo" alerta={resumen.pierden > 0} href="#margenes" />
      </div>

      {/* Por reponer */}
      <Seccion id="reponer" icono={<PackageSearch />} titulo="Por reponer" descarga={exportar("reponer")}
        texto={`Productos que se agotaron desde la carga anterior y productos con ${op.stockMinimo === 0 ? "stock 0" : `stock de ${op.stockMinimo} o menos`}. Primero los que más se vendieron.`}>
        {r.agotados.length > 0 && (
          <Tabla titulo={`Se agotaron (ya no aparecen en el Excel) · ${r.agotados.length}`} filas={r.agotados}
            columnas={[{ titulo: "Stock antes", valor: (f) => num(f.stockAnterior ?? 0) }, colCosto, colPvp]} />
        )}
        <Tabla titulo={`Stock bajo · ${r.stockBajo.length}`} filas={r.stockBajo} vacio="Ningún producto tiene stock bajo."
          columnas={[
            { titulo: "Stock", valor: (f) => <strong>{num(f.stock)}</strong> },
            ...(r.anterior ? [{ titulo: "Vendido*", valor: (f: FilaReporte) => (f.stockAnterior !== null && f.stockAnterior > f.stock ? num(f.stockAnterior - f.stock) : "—") }] : []),
            colCosto, colPvp,
          ]} />
        {r.anterior && <p className="text-xs text-marca-gris">* Vendido = bajó el stock entre la carga anterior y esta (ventas u otras salidas).</p>}
      </Seccion>

      {/* Márgenes */}
      <Seccion id="margenes" icono={<TrendingDown />} titulo="Alertas de precio" descarga={exportar("margenes")}
        texto={`Margen = (PVP sin IVA − costo) ÷ PVP sin IVA. En rojo los que se venden por debajo del costo; en amarillo los que ganan menos del ${op.margenMinimo} %.`}>
        <Tabla titulo={`Se venden por debajo del costo · ${r.pierden.length}`} filas={r.pierden} vacio="Ningún producto se vende bajo el costo. 👍"
          columnas={[colCosto, { titulo: "PVP sin IVA", valor: (f) => formatoUSD(f.pvpSinIva) }, colPvp, colMargen]} />
        <Tabla titulo={`Margen menor al ${op.margenMinimo} % · ${r.margenBajo.length}`} filas={r.margenBajo} vacio="Ninguno."
          columnas={[colCosto, { titulo: "PVP sin IVA", valor: (f) => formatoUSD(f.pvpSinIva) }, colPvp, colMargen]} />
      </Seccion>

      {/* Sin movimiento */}
      <Seccion id="sin-movimiento" icono={<Snail />} titulo="Sin movimiento" descarga={r.sinMovimiento.length > 0 ? exportar("sin-movimiento") : undefined}
        texto={`Productos con el mismo stock desde hace ${op.diasSinMovimiento} días o más: mercadería quieta que inmoviliza dinero. Ordenados por tiempo sin moverse y por capital.`}>
        {r.historialDias < op.diasSinMovimiento ? (
          <p className="text-sm text-marca-gris">
            Tu historial de inventarios cubre {r.historialDias === 0 ? "menos de un día" : `${r.historialDias} día(s)`} ({r.cargasComparadas} carga(s)):
            todavía no alcanza para saber qué lleva {op.diasSinMovimiento} días sin moverse. Sube el inventario con frecuencia
            (por ejemplo, cada semana) y este informe se llenará solo.
          </p>
        ) : (
          <Tabla titulo={`Sin movimiento ${op.diasSinMovimiento} días o más · ${r.sinMovimiento.length}`} filas={r.sinMovimiento} vacio="Todos los productos tuvieron movimiento."
            columnas={[
              { titulo: "Stock", valor: (f) => num(f.stock) },
              { titulo: "Sin cambios desde", valor: (f) => (f.igualDesde ? `${fechaEC(f.igualDesde)} (${f.diasSinMovimiento} d)` : "—") },
              { titulo: "Capital", valor: (f) => formatoUSD(f.capital) },
            ]} />
        )}
      </Seccion>

      {/* Capital */}
      <Seccion id="capital" icono={<PiggyBank />} titulo="Dónde está tu dinero" descarga={exportar("capital")}
        texto="Productos que más capital tienen invertido (costo × stock).">
        <Tabla titulo="Los 20 con más capital" filas={r.capital.slice(0, 20)}
          columnas={[
            { titulo: "Stock", valor: (f) => num(f.stock) },
            colCosto,
            { titulo: "Capital", valor: (f) => <strong>{formatoUSD(f.capital)}</strong> },
            {
              titulo: "% del total",
              valor: (f) => {
                const p = f.capital / (resumen.totalCosto || 1);
                return (
                  <span className="inline-flex items-center gap-2">
                    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-marca-fondo sm:inline-block">
                      <span className="block h-full rounded-full bg-marca-azul" style={{ width: `${Math.min(100, p * 100 * 4)}%` }} />
                    </span>
                    {pct(p)}
                  </span>
                );
              },
            },
          ]} />
      </Seccion>
    </div>
  );
}

function Volver() {
  return (
    <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-sm text-marca-azul hover:underline">
      <ArrowLeft className="size-4" /> Inventario
    </Link>
  );
}

function Dato({ titulo, valor, nota, alerta, href }: { titulo: string; valor: string; nota: string; alerta?: boolean; href?: string }) {
  const contenido = (
    <>
      <p className="flex items-center gap-1 text-xs text-marca-gris">
        {alerta && <AlertTriangle className="size-3.5 text-amber-700" aria-hidden />}
        {titulo}
      </p>
      <p className="text-lg font-bold text-marca-navy tabular-nums">{valor}</p>
      <p className="text-xs text-marca-gris">{nota}</p>
    </>
  );
  const clase = `block rounded-xl border bg-card p-3 ${alerta ? "border-amber-300" : ""}`;
  return href ? <a href={href} className={`${clase} hover:border-marca-azul/50`}>{contenido}</a> : <div className={clase}>{contenido}</div>;
}

function Seccion({ id, icono, titulo, texto, descarga, children }: { id: string; icono: React.ReactNode; titulo: string; texto: string; descarga?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-marca-navy [&_svg]:size-5 [&_svg]:text-marca-azul">{icono}{titulo}</h2>
          <p className="max-w-2xl text-sm text-marca-gris">{texto}</p>
        </div>
        {descarga && (
          <Button asChild variant="outline" size="sm">
            <a href={descarga} download><Download /> Descargar Excel</a>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

type Columna = { titulo: string; valor: (f: FilaReporte) => React.ReactNode };

function Tabla({ titulo, filas, columnas, vacio }: { titulo: string; filas: FilaReporte[]; columnas: Columna[]; vacio?: string }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-marca-navy">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-sm text-marca-gris">{vacio}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-marca-fondo/70 text-left text-xs text-marca-gris">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Producto</th>
                {columnas.map((c) => <th key={c.titulo} className="px-3 py-2 text-right font-medium">{c.titulo}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filas.slice(0, MAX_FILAS).map((f) => (
                <tr key={f.codigo}>
                  <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">{f.codigo}</td>
                  <td className="px-3 py-1.5">
                    {f.nombre}
                    <span className="block text-xs text-marca-gris">{f.categoria}</span>
                  </td>
                  {columnas.map((c) => <td key={c.titulo} className="px-3 py-1.5 text-right whitespace-nowrap tabular-nums">{c.valor(f)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {filas.length > MAX_FILAS && (
            <p className="border-t px-3 py-2 text-xs text-marca-gris">Se muestran {MAX_FILAS} de {filas.length}. Descarga el Excel para verlos todos.</p>
          )}
        </div>
      )}
    </div>
  );
}
