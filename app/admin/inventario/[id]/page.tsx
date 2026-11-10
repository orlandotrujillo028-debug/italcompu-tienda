import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, CircleDollarSign, PackageMinus, PackagePlus, Store } from "lucide-react";
import { BotonAccion } from "@/components/admin/boton-accion";
import { requireRole } from "@/lib/auth-guards";
import { compararCargas, type Cambio, type ItemComparable } from "@/lib/inventario/comparar";
import { MOTIVO_OCULTO, vistaPrevia } from "@/lib/inventario/sincronizar";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { aplicarInventario, eliminarCarga } from "../actions";

export const metadata: Metadata = { title: "Comparación de inventario" };

type Props = { params: Promise<{ id: string }> };

const num = (n: number) => n.toLocaleString("es-EC", { maximumFractionDigits: 2 });
const conSigno = (n: number) => (n > 0 ? `+${num(n)}` : num(n));
/** +$1,00 / −$0,27 */
const difUSD = (n: number) => (n < 0 ? `−${formatoUSD(-n)}` : `+${formatoUSD(n)}`);

async function itemsDe(cargaId: string): Promise<ItemComparable[]> {
  const items = await prisma.inventarioItem.findMany({ where: { cargaId }, select: { codigo: true, nombre: true, categoria: true, stock: true, costo: true, pvp: true } });
  return items.map((i) => ({ ...i, stock: Number(i.stock), costo: Number(i.costo), pvp: Number(i.pvp) }));
}

export default async function CargaInventarioPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;
  const carga = await prisma.inventarioCarga.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
  if (!carga) notFound();

  const [anterior, ultima] = await Promise.all([
    prisma.inventarioCarga.findFirst({
      where: { sucursal: carga.sucursal, createdAt: { lt: carga.createdAt } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventarioCarga.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }),
  ]);
  const esUltima = ultima?.id === carga.id;
  const [actuales, previos, previa, ocultos] = await Promise.all([
    itemsDe(carga.id),
    anterior ? itemsDe(anterior.id) : Promise.resolve([]),
    esUltima && !carga.aplicadaEn ? vistaPrevia(prisma, carga.id) : Promise.resolve(null),
    prisma.product.count({ where: { estado: "BORRADOR", motivoRechazo: MOTIVO_OCULTO } }),
  ]);
  const cmp = anterior ? compararCargas(actuales, previos) : null;

  return (
    <div className="space-y-5">
      <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-sm text-marca-azul hover:underline">
        <ArrowLeft className="size-4" /> Inventario
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-marca-navy">Inventario del {fechaEC(carga.createdAt, "conHora")}</h1>
        <p className="text-sm text-marca-gris">
          {carga.sucursal} · {carga.archivo}
          {carga.user?.name ? ` · subido por ${carga.user.name}` : ""}
        </p>
      </header>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Total titulo="Productos" valor={String(carga.totalProductos)} antes={anterior?.totalProductos} formato={(n) => conSigno(n)} />
        <Total titulo="Unidades" valor={num(Number(carga.totalUnidades))} actual={Number(carga.totalUnidades)} antes={anterior ? Number(anterior.totalUnidades) : undefined} formato={conSigno} />
        <Total titulo="Valor a costo" valor={formatoUSD(Number(carga.totalCosto))} actual={Number(carga.totalCosto)} antes={anterior ? Number(anterior.totalCosto) : undefined} formato={difUSD} />
        <Total titulo="Valor a PVP" valor={formatoUSD(Number(carga.totalPvp))} actual={Number(carga.totalPvp)} antes={anterior ? Number(anterior.totalPvp) : undefined} formato={difUSD} />
      </div>

      {/* Aplicar a la tienda */}
      <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-marca-navy">
          <Store className="size-5 text-marca-azul" aria-hidden /> Tienda en línea
        </h2>
        {carga.aplicadaEn ? (
          <p className="text-sm text-emerald-800">✓ Este inventario se aplicó a la tienda el {fechaEC(carga.aplicadaEn, "conHora")}</p>
        ) : !esUltima ? (
          <p className="text-sm text-marca-gris">Esta carga no se aplicó y ya hay una más reciente: solo sirve como historial.</p>
        ) : (
          previa && (
            <>
              <p className="text-sm text-marca-gris">Si aplicas este inventario, en la tienda pasará esto:</p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li><strong className="text-marca-navy">{previa.crear}</strong> productos nuevos se publicarán</li>
                <li><strong className="text-marca-navy">{previa.actualizar}</strong> productos cambiarán de stock o precio</li>
                <li><strong className="text-marca-navy">{previa.ocultar}</strong> productos que no están en el Excel se ocultarán</li>
                <li><strong className="text-marca-navy">{previa.reactivar}</strong> productos ocultos volverán a mostrarse</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <BotonAccion accion={aplicarInventario.bind(null, carga.id)} exito="Inventario aplicado a la tienda" confirmar="¿Aplicar a la tienda?">
                  Aplicar a la tienda
                </BotonAccion>
                <BotonAccion variant="outline" accion={eliminarCarga.bind(null, carga.id)} exito="Carga eliminada" confirmar="¿Borrar esta carga?">
                  Borrar carga
                </BotonAccion>
              </div>
              <p className="text-xs text-marca-gris">
                Solo cambian stock y precio de los productos que ya existen: nombres, fotos, descripciones y categorías que
                edites en el panel se conservan.
              </p>
            </>
          )
        )}
        {ocultos > 0 && (
          <p className="text-xs text-marca-gris">
            Hay {ocultos} producto(s) ocultos porque no estaban en el último inventario aplicado.{" "}
            <Link href="/admin/inventario/ocultos" className="text-marca-azul underline">Revisarlos y volver a mostrar</Link>
          </p>
        )}
      </section>

      {/* Comparación */}
      {!cmp ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-marca-gris">
          Es la primera carga de {carga.sucursal}: todavía no hay un inventario anterior con qué comparar. Cuando subas el
          próximo, aquí verás qué llegó, qué se agotó y qué cambió de precio.
        </p>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-marca-navy">Comparado con el inventario del {fechaEC(anterior!.createdAt, "conHora")}</h2>
            <p className="text-sm text-marca-gris">{cmp.sinCambios} productos siguen igual.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Contador href="#nuevos" icono={<PackagePlus />} titulo="Llegaron" n={cmp.nuevos.length} tono="verde" />
            <Contador href="#retirados" icono={<PackageMinus />} titulo="Ya no están" n={cmp.retirados.length} tono="rojo" />
            <Contador href="#sube" icono={<ArrowUp />} titulo="Más stock" n={cmp.subeStock.length} tono="verde" />
            <Contador href="#baja" icono={<ArrowDown />} titulo="Menos stock" n={cmp.bajaStock.length} tono="rojo" />
            <Contador href="#precio" icono={<CircleDollarSign />} titulo="Cambió PVP" n={cmp.cambioPrecio.length} tono="azul" />
            <Contador href="#costo" icono={<CircleDollarSign />} titulo="Cambió costo" n={cmp.cambioCosto.length} tono="azul" />
          </div>

          <Lista id="nuevos" titulo="Productos que llegaron (no estaban antes)" vacio="No llegaron productos nuevos." filas={cmp.nuevos}
            columnas={["Stock", "PVP"]} celdas={(i) => [num(i.stock), formatoUSD(i.pvp)]} />
          <Lista id="retirados" titulo="Productos que ya no están (se agotaron o se dieron de baja)" vacio="No faltan productos." filas={cmp.retirados}
            columnas={["Stock antes", "PVP"]} celdas={(i) => [num(i.stock), formatoUSD(i.pvp)]} />
          {cmp.retirados.length > 0 && (
            <p className="-mt-2 px-1 text-sm text-marca-gris">
              Al aplicar este inventario, los que ya no están se ocultan de la tienda (no se borran).{" "}
              <Link href="/admin/inventario/ocultos" className="font-medium text-marca-azul underline">Revisar ocultos y volver a mostrar los que sí tienes</Link>
            </p>
          )}
          <Lista id="sube" titulo="Subió el stock" vacio="Ningún producto subió de stock." filas={cmp.subeStock}
            columnas={["Antes", "Ahora", "Diferencia"]} celdas={(c: Cambio) => [num(c.stockAntes), num(c.stockAhora), conSigno(c.stockAhora - c.stockAntes)]} />
          <Lista id="baja" titulo="Bajó el stock (ventas o salidas)" vacio="Ningún producto bajó de stock." filas={cmp.bajaStock}
            columnas={["Antes", "Ahora", "Diferencia"]} celdas={(c: Cambio) => [num(c.stockAntes), num(c.stockAhora), conSigno(c.stockAhora - c.stockAntes)]} />
          <Lista id="precio" titulo="Cambió el precio de venta (PVP)" vacio="Ningún precio cambió." filas={cmp.cambioPrecio}
            columnas={["PVP antes", "PVP ahora", "Diferencia"]} celdas={(c: Cambio) => [formatoUSD(c.pvpAntes), formatoUSD(c.pvpAhora), difUSD(c.pvpAhora - c.pvpAntes)]} />
          <Lista id="costo" titulo="Cambió el costo pero no el PVP (revisa el margen)" vacio="Ningún costo cambió." filas={cmp.cambioCosto}
            columnas={["Costo antes", "Costo ahora", "PVP"]} celdas={(c: Cambio) => [formatoUSD(c.costoAntes), formatoUSD(c.costoAhora), formatoUSD(c.pvpAhora)]} />
        </section>
      )}
    </div>
  );
}

function Total({ titulo, valor, actual, antes, formato }: { titulo: string; valor: string; actual?: number; antes?: number; formato: (n: number) => string }) {
  const dif = antes === undefined ? null : (actual ?? Number(valor)) - antes;
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-marca-gris">{titulo}</p>
      <p className="text-lg font-bold text-marca-navy tabular-nums">{valor}</p>
      {dif !== null && Math.abs(dif) > 0.004 && (
        <p className={`text-xs tabular-nums ${dif > 0 ? "text-emerald-700" : "text-red-700"}`}>{formato(dif)} vs. anterior</p>
      )}
    </div>
  );
}

const TONOS = { verde: "text-emerald-700 bg-emerald-50", rojo: "text-red-700 bg-red-50", azul: "text-marca-azul bg-marca-azul/10" };

function Contador({ href, icono, titulo, n, tono }: { href: string; icono: React.ReactNode; titulo: string; n: number; tono: keyof typeof TONOS }) {
  return (
    <a href={href} className="flex items-center gap-2 rounded-xl border bg-card p-3 hover:border-marca-azul/40">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4 ${TONOS[tono]}`}>{icono}</span>
      <span>
        <span className="block text-lg leading-tight font-bold text-marca-navy tabular-nums">{n}</span>
        <span className="block text-xs text-marca-gris">{titulo}</span>
      </span>
    </a>
  );
}

function Lista<T extends { codigo: string; nombre: string; categoria: string }>({
  id, titulo, vacio, filas, columnas, celdas,
}: { id: string; titulo: string; vacio: string; filas: T[]; columnas: string[]; celdas: (f: T) => string[] }) {
  return (
    <details id={id} open={filas.length > 0 && filas.length <= 30} className="scroll-mt-24 rounded-xl border bg-card">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-marca-navy">
        {titulo} <span className="font-normal text-marca-gris">({filas.length})</span>
      </summary>
      {filas.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-marca-gris">{vacio}</p>
      ) : (
        <div className="overflow-x-auto border-t">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-marca-fondo/70 text-left text-xs text-marca-gris">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Producto</th>
                {columnas.map((c) => <th key={c} className="px-3 py-2 text-right font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filas.map((f) => (
                <tr key={f.codigo}>
                  <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">{f.codigo}</td>
                  <td className="px-3 py-1.5">
                    {f.nombre}
                    <span className="block text-xs text-marca-gris">{f.categoria}</span>
                  </td>
                  {celdas(f).map((v, k) => <td key={k} className="px-3 py-1.5 text-right whitespace-nowrap tabular-nums">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
