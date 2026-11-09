import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Prisma, Rol } from "@prisma/client";
import { BotonAccion } from "@/components/admin/boton-accion";
import { NuevoPersonal, SelectorRol } from "@/components/admin/usuarios";
import { alternarActivo } from "./actions";
import { requireRole } from "@/lib/auth-guards";
import { fechaEC } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Usuarios" };

const POR_PAGINA = 20;
const ROLES = { todos: "Todos", CLIENTE: "Clientes", VENDEDOR: "Personal", ADMIN: "Administradores" } as const;
type Props = { searchParams: Promise<{ q?: string; rol?: string; page?: string }> };

export default async function UsuariosPage({ searchParams }: Props) {
  const admin = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const rol = sp.rol && sp.rol in ROLES ? (sp.rol as keyof typeof ROLES) : "todos";

  const where: Prisma.UserWhereInput = {
    ...(rol !== "todos" ? { rol: rol as Rol } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { cedula: { contains: q } }] } : {}),
  };
  const total = await prisma.user.count({ where });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number(sp.page) || 1), paginas);
  const usuarios = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: { id: true, name: true, email: true, rol: true, activo: true, createdAt: true, distribuidor: { select: { estado: true } }, _count: { select: { orders: true } } },
  });
  const url = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: q || undefined, rol: rol !== "todos" ? rol : undefined, ...cambios })) if (v) p.set(k, v);
    return `/admin/usuarios${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marca-navy">Usuarios</h1>
        <NuevoPersonal />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar por rol" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => (
            <Link key={r} href={url({ rol: r === "todos" ? undefined : r, page: undefined })} aria-current={rol === r ? "page" : undefined} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${rol === r ? "border-marca-azul bg-marca-azul text-white" : "bg-white text-marca-navy hover:bg-accent"}`}>
              {ROLES[r]}
            </Link>
          ))}
        </nav>
        <form className="relative lg:w-72" action="/admin/usuarios">
          {rol !== "todos" && <input type="hidden" name="rol" value={rol} />}
          <label htmlFor="buscar-usuario" className="sr-only">Buscar por nombre, correo o cédula</label>
          <input id="buscar-usuario" name="q" defaultValue={q} placeholder="Nombre, correo o cédula" className="h-9 w-full rounded-lg border border-input bg-white pr-9 pl-3 text-sm outline-none focus:border-ring" />
          <Search className="absolute top-2.5 right-3 size-4 text-marca-gris" />
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-marca-fondo text-left text-xs text-marca-gris uppercase">
            <tr>
              <th className="px-3 py-2.5 font-medium">Usuario</th>
              <th className="px-3 py-2.5 font-medium">Rol</th>
              <th className="px-3 py-2.5 text-right font-medium">Pedidos</th>
              <th className="px-3 py-2.5 font-medium">Registro</th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map((u) => {
              const yo = u.id === admin.id;
              return (
                <tr key={u.id} className={u.activo ? "" : "bg-muted/60 text-marca-gris"}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{u.name ?? "Sin nombre"} {yo && <span className="text-xs text-marca-azul">(tú)</span>}</p>
                    <p className="text-xs text-marca-gris">{u.email}</p>
                    {u.distribuidor && <p className="text-xs text-marca-azul">Distribuidor: {u.distribuidor.estado.toLowerCase()}</p>}
                  </td>
                  <td className="px-3 py-2"><SelectorRol userId={u.id} rol={u.rol} deshabilitado={yo} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{u._count.orders}</td>
                  <td className="px-3 py-2 text-marca-gris">{fechaEC(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    {yo ? (
                      <span className="text-xs text-emerald-700">Activa</span>
                    ) : (
                      <BotonAccion
                        size="sm"
                        variant={u.activo ? "outline" : "secondary"}
                        confirmar={u.activo ? "¿Desactivar? No podrá entrar." : undefined}
                        accion={alternarActivo.bind(null, u.id)}
                        exito={u.activo ? "Cuenta desactivada" : "Cuenta activada"}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </BotonAccion>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && <Link href={url({ page: String(pagina - 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent"><ChevronLeft className="size-4" /> Anterior</Link>}
          <span className="text-marca-gris">Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link href={url({ page: String(pagina + 1) })} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 hover:bg-accent">Siguiente <ChevronRight className="size-4" /></Link>}
        </nav>
      )}
    </div>
  );
}
