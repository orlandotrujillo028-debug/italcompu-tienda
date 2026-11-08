import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { panelPorRol, type Rol } from "@/lib/roles";

/**
 * Usuario con sesión, leído de la BASE DE DATOS (no solo del token).
 * Así, si el admin desactiva a alguien, le cambia el rol o aprueba su solicitud
 * de distribuidor, se aplica al instante.
 * Devuelve null si no hay sesión o la cuenta está desactivada.
 */
export const getUsuarioActual = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      rol: true,
      activo: true,
      distribuidor: { select: { id: true, nombreLocal: true, estado: true, motivoRechazo: true } },
    },
  });
  if (!usuario || !usuario.activo) return null;
  return usuario;
});

export type UsuarioActual = NonNullable<Awaited<ReturnType<typeof getUsuarioActual>>>;

/** ¿Este usuario debe ver precios de distribuidor? (cliente con solicitud APROBADA) */
export function esDistribuidorAprobado(usuario: UsuarioActual | null): boolean {
  return usuario?.rol === "CLIENTE" && usuario.distribuidor?.estado === "APROBADO";
}

/** Exige sesión iniciada. Úsalo en páginas y Server Actions. */
export async function requireUser(): Promise<UsuarioActual> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/**
 * Exige uno de los roles indicados. Ejemplo en una Server Action:
 *   const admin = await requireRole("ADMIN");
 * Si no tiene sesión → /login. Si tiene otro rol → a su propio panel.
 */
export async function requireRole(...roles: Rol[]): Promise<UsuarioActual> {
  const usuario = await requireUser();
  if (!roles.includes(usuario.rol)) redirect(panelPorRol(usuario.rol));
  return usuario;
}
