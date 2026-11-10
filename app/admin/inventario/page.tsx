import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn, ChevronRight } from "lucide-react";
import { SubirInventario } from "@/components/admin/subir-inventario";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inventario de sucursal" };

const unidades = (n: number) => n.toLocaleString("es-EC", { maximumFractionDigits: 2 });

export default async function InventarioPage() {
  await requireRole("ADMIN");
  const cargas = await prisma.inventarioCarga.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      sucursal: true,
      archivo: true,
      totalProductos: true,
      totalUnidades: true,
      totalCosto: true,
      totalPvp: true,
      aplicadaEn: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-marca-navy">Inventario de sucursal</h1>
          <p className="text-sm text-marca-gris">
            Sube el inventario cada vez que lo exportes del sistema: se compara con el anterior para ver qué llegó, qué se
            agotó y qué cambió de precio.
          </p>
        </div>
        {cargas.length > 0 && (
          <Button asChild>
            <Link href="/admin/inventario/reporte"><ChartColumn /> Reporte: reponer, márgenes y capital</Link>
          </Button>
        )}
      </div>

      <SubirInventario />

      <section className="space-y-2">
        <h2 className="font-semibold text-marca-navy">Historial de cargas</h2>
        {cargas.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-marca-gris">Todavía no se ha subido ningún inventario.</p>
        ) : (
          <ol className="divide-y rounded-xl border bg-card">
            {cargas.map((c, i) => (
              <li key={c.id}>
                <Link href={`/admin/inventario/${c.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-marca-fondo/70">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-marca-navy">{fechaEC(c.createdAt, "conHora")}</span>
                      {i === 0 && <span className="rounded-full bg-marca-azul/10 px-2 py-0.5 text-xs font-medium text-marca-azul">Más reciente</span>}
                      {c.aplicadaEn ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Aplicado a la tienda</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Solo comparado</span>
                      )}
                    </p>
                    <p className="truncate text-marca-gris">
                      {c.sucursal} · {c.archivo}
                      {c.user?.name ? ` · ${c.user.name}` : ""}
                    </p>
                  </div>
                  <div className="hidden text-right tabular-nums sm:block">
                    <p className="font-medium">{c.totalProductos} productos · {unidades(Number(c.totalUnidades))} u.</p>
                    <p className="text-xs text-marca-gris">
                      Costo {formatoUSD(Number(c.totalCosto))} · PVP {formatoUSD(Number(c.totalPvp))}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-marca-gris" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
