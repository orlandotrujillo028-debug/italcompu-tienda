// Reglas de roles compartidas por el middleware (edge) y el servidor.
// No importar Prisma aquí: este archivo también corre en el middleware.

export type Rol = "ADMIN" | "VENDEDOR" | "CLIENTE";

/** Panel al que va cada rol después de iniciar sesión. */
export function panelPorRol(rol: Rol): string {
  switch (rol) {
    case "ADMIN":
      return "/admin";
    case "VENDEDOR":
      return "/vendedor";
    default:
      return "/cuenta";
  }
}

/** Nombre legible del rol para mostrar en la interfaz. */
export const nombreRol: Record<Rol, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CLIENTE: "Cliente",
};

const empiezaCon = (ruta: string, base: string) => ruta === base || ruta.startsWith(base + "/");

/** Rutas de inicio de sesión / registro (un usuario con sesión no necesita verlas). */
export function esRutaDeAcceso(ruta: string): boolean {
  return ["/login", "/registro", "/registro-vendedor", "/recuperar-contrasena"].some((r) => empiezaCon(ruta, r));
}

/**
 * ¿Puede este rol abrir esta ruta?
 * - /admin solo ADMIN · /vendedor solo VENDEDOR · el resto, cualquier usuario con sesión.
 */
export function rutaPermitida(rol: Rol, ruta: string): boolean {
  if (empiezaCon(ruta, "/admin")) return rol === "ADMIN";
  if (empiezaCon(ruta, "/vendedor")) return rol === "VENDEDOR";
  return true;
}

/** Rutas que exigen sesión iniciada. */
export function rutaRequiereSesion(ruta: string): boolean {
  return ["/admin", "/vendedor", "/cuenta", "/checkout"].some((r) => empiezaCon(ruta, r));
}

/**
 * Decide a dónde mandar al usuario después de entrar.
 * Solo acepta rutas internas ("/algo", nunca "//otro-sitio.com") que su rol pueda abrir.
 */
export function destinoTrasLogin(rol: Rol, callbackUrl?: string | null): string {
  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.startsWith("/\\") &&
    !esRutaDeAcceso(callbackUrl.split("?")[0]) &&
    rutaPermitida(rol, callbackUrl.split("?")[0])
  ) {
    return callbackUrl;
  }
  return panelPorRol(rol);
}
