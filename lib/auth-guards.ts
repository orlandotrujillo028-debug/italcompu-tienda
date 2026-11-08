import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { panelPorRol, type Rol } from "@/lib/roles";

/**
 * Usuario con sesión, leído de la BASE DE DATOS (no solo del token).
 * Así, si el admin desactiva a alguien o le cambia el rol, se aplica al instante.
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
      vendorProfile: { select: { id: true, nombreTienda: true, estado: true } },
    },
  });
  if (!usuario || !usuario.activo) return null;
  return usuario;
});

export type UsuarioActual = NonNullable<Awaited<ReturnType<typeof getUsuarioActual>>>;

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

/** Exige un vendedor con la tienda APROBADA (para crear/editar productos, ver pedidos, etc.). */
export async function requireVendedorAprobado() {
  const usuario = await requireRole("VENDEDOR");
  const tienda = usuario.vendorProfile;
  if (!tienda || tienda.estado !== "APROBADO") redirect("/vendedor");
  return { ...usuario, vendorProfile: tienda };
}
