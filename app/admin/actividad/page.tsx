import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Registro de actividad" };

const POR_PAGINA = 40;
// Texto legible para cada acción registrada.
const ACCIONES: Record<string, string> = {
  "producto.creado": "Creó producto",
  "producto.editado": "Editó producto",
  "producto.aprobado": "Aprobó producto",
  "producto.rechazado": "Rechazó producto",
  "producto.destacado": "Destacado",
  "producto.nuevo": "Etiqueta “Nuevo”",
  "producto.despublicado": "Despublicó producto",
  "pedido.estado": "Cambió estado de pedido",
  "pedido.guia": "Actualizó guía",
  "pedido.pago_confirmado": "Confirmó pago",
  "pedido.cancelado": "Canceló pedido",
  "distribuidor.aprobado": "Aprobó distribuidor",
  "distribuidor.rechazado": "Rechazó distribuidor",
  "distribuidor.suspendido": "Suspendió distribuidor",
  "usuario.rol": "Cambió rol",
  "usuario.activado": "Activó cuenta",
  "usuario.desactivado": "Desactivó cuenta",
  "usuario.personal_creado": "Creó cuenta de personal",
  "categoria.creada": "Creó categoría",
  "categoria.editada": "Editó categoría",
  "categoria.eliminada": "Eliminó categoría",
  "marca.creada": "Creó marca",
  "marca.editada": "Editó marca",
  "marca.eliminada": "Eliminó marca",
  "banner.creado": "Creó banner",
  "banner.editado": "Editó banner",
  "banner.eliminado": "Eliminó banner",
  "configuracion.editada": "Cambió configuración",
  "inventario.subido": "Subió inventario",
  "inventario.aplicado": "Aplicó inventario a la tienda",
  "usuario.clave": "Creó una contraseña temporal para",
  "inventario.mostrados": "Mostró a mano productos ocultos por inventario",
  "inventario.ocultado": "Volvió a ocultar un producto mostrado a mano",
  "inventario.eliminado": "Borró carga de inventario",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ActividadPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const total = await prisma.activityLog.count();
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number((await searchParams).page) || 1), paginas);
  const registros = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: { id: true, accion: true, detalle: true, createdAt: true, user: { select: { name: true, email: true, rol: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca-navy">Registro de actividad</h1>
        <p className="text-sm text-marca-gris">Quién hizo qué y cuándo (personal y administradores).</p>
      </div>
      {registros.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-marca-gris">Todavía no hay actividad registrada.</p>
      ) : (
        <ol className="divide-y rounded-xl border bg-card">
          {registros.map((r) => (
            <li key={r.id} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[150px_180px_1fr]">
              <span className="text-xs text-marca-gris tabular-nums">{fechaEC(r.createdAt, "conHora")}</span>
              <span className="min-w-0 truncate font-medium" title={r.user?.email}>{r.user?.name ?? r.user?.email ?? "Usuario eliminado"}</span>
              <span className="min-w-0">
                <span className="font-semibold text-marca-navy">{ACCIONES[r.accion] ?? r.accion}</span>
                {r.detalle && <span className="text-marca-gris"> · {r.detalle}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && <Link href={`/admin/actividad?page=${pagina - 1}`} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent"><ChevronLeft className="size-4" /> Más recientes</Link>}
          <span className="text-marca-gris">Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link href={`/admin/actividad?page=${pagina + 1}`} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">Anteriores <ChevronRight className="size-4" /></Link>}
        </nav>
      )}
    </div>
  );
}
