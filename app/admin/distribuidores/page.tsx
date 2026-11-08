import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Check, Mail, MapPin, Phone, RotateCcw, Store } from "lucide-react";
import type { EstadoDistribuidor } from "@prisma/client";
import { AccionConTexto, BotonAccion } from "@/components/admin/boton-accion";
import { aprobarDistribuidor, rechazarDistribuidor, suspenderDistribuidor } from "./actions";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { ESTADOS_VENTA } from "@/lib/ventas";

export const metadata: Metadata = { title: "Distribuidores" };

const ESTADOS: Record<EstadoDistribuidor, { texto: string; color: string }> = {
  PENDIENTE: { texto: "Por revisar", color: "bg-amber-100 text-amber-800" },
  APROBADO: { texto: "Aprobados", color: "bg-emerald-100 text-emerald-800" },
  RECHAZADO: { texto: "Rechazados", color: "bg-red-100 text-red-800" },
  SUSPENDIDO: { texto: "Suspendidos", color: "bg-slate-200 text-slate-700" },
};

const UNO: Record<EstadoDistribuidor, string> = { PENDIENTE: "Por revisar", APROBADO: "Aprobado", RECHAZADO: "Rechazado", SUSPENDIDO: "Suspendido" };

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function DistribuidoresPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const e = (await searchParams).estado;
  const estado: EstadoDistribuidor = e && e in ESTADOS ? (e as EstadoDistribuidor) : "PENDIENTE";

  const [conteos, perfiles] = await Promise.all([
    prisma.distributorProfile.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.distributorProfile.findMany({
      where: { estado },
      orderBy: { createdAt: estado === "PENDIENTE" ? "asc" : "desc" },
      include: { user: { select: { id: true, name: true, email: true, telefono: true } } },
    }),
  ]);
  // Lo que ha comprado cada distribuidor (pedidos pagados o en curso).
  const compras = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: perfiles.map((p) => p.userId) }, estado: { in: ESTADOS_VENTA } },
    _sum: { total: true },
    _count: { _all: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca-navy">Distribuidores</h1>
      <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {(Object.keys(ESTADOS) as EstadoDistribuidor[]).map((k) => (
          <Link
            key={k}
            href={`/admin/distribuidores${k === "PENDIENTE" ? "" : `?estado=${k}`}`}
            aria-current={estado === k ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${estado === k ? "border-marca-azul bg-marca-azul text-white" : "bg-white text-marca-navy hover:bg-accent"}`}
          >
            {ESTADOS[k].texto} ({conteos.find((c) => c.estado === k)?._count._all ?? 0})
          </Link>
        ))}
      </nav>

      {perfiles.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-marca-gris">No hay distribuidores en este estado.</p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {perfiles.map((p) => {
            const c = compras.find((x) => x.userId === p.userId);
            return (
              <li key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-bold text-marca-navy"><Store className="size-4 text-marca-azul" /> {p.nombreLocal}</p>
                    <p className="text-marca-gris">{p.razonSocial} · RUC <span className="font-mono select-all">{p.ruc}</span></p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADOS[p.estado].color}`}>{UNO[p.estado]}</span>
                </div>
                <dl className="grid gap-1">
                  <div className="flex gap-2"><dt className="text-marca-gris">Tipo:</dt><dd>{p.tipoNegocio}</dd></div>
                  <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-marca-cyan" /><dd>{p.direccion ? `${p.direccion}, ` : ""}{p.ciudad}, {p.provincia}</dd></div>
                  <div className="flex items-center gap-2"><Phone className="size-4 text-marca-cyan" /><dd>{p.telefono}</dd></div>
                  <div className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0 text-marca-cyan" /><dd>{p.user.name} · {p.user.email}</dd></div>
                </dl>
                <p className="rounded-lg bg-marca-fondo px-3 py-2 text-xs text-marca-gris">
                  Solicitó el {fechaEC(p.createdAt)}
                  {p.aprobadoEn && ` · aprobado el ${fechaEC(p.aprobadoEn)}`} · Compras: <strong className="text-foreground">{c?._count._all ?? 0} pedidos, {formatoUSD(c?._sum.total ?? 0)}</strong>
                </p>
                {p.motivoRechazo && <p className="text-xs text-destructive">Motivo de rechazo: {p.motivoRechazo}</p>}

                <div className="mt-auto flex flex-wrap gap-2">
                  {(p.estado === "PENDIENTE" || p.estado === "RECHAZADO" || p.estado === "SUSPENDIDO") && (
                    <BotonAccion size="sm" accion={aprobarDistribuidor.bind(null, p.id)} exito={`${p.nombreLocal} ya ve precios de distribuidor`}>
                      {p.estado === "SUSPENDIDO" ? <RotateCcw /> : <Check />} {p.estado === "SUSPENDIDO" ? "Reactivar" : "Aprobar"}
                    </BotonAccion>
                  )}
                  {p.estado === "PENDIENTE" && (
                    <AccionConTexto accion={rechazarDistribuidor.bind(null, p.id)} exito="Solicitud rechazada" boton="Rechazar" placeholder="Motivo (el cliente lo verá)" etiqueta={`Motivo de rechazo de ${p.nombreLocal}`} />
                  )}
                  {p.estado === "APROBADO" && (
                    <BotonAccion size="sm" variant="outline" className="text-destructive" confirmar="¿Suspender precios de distribuidor?" accion={suspenderDistribuidor.bind(null, p.id)} exito="Distribuidor suspendido">
                      <Ban /> Suspender
                    </BotonAccion>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
