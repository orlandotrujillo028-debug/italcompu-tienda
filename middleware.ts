import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { panelPorRol, rutaPermitida, rutaRequiereSesion } from "@/lib/roles";

// Primera barrera: revisa el token antes de abrir la página.
// La segunda barrera (con datos frescos de la base) está en lib/auth-guards.ts.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const usuario = req.auth?.user;

  if (!rutaRequiereSesion(pathname)) return NextResponse.next();

  // Sin sesión → al login, recordando a dónde quería ir.
  if (!usuario?.rol) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }

  // Con sesión pero sin permiso → a su propio panel.
  if (!rutaPermitida(usuario.rol, pathname)) {
    return NextResponse.redirect(new URL(panelPorRol(usuario.rol), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/vendedor/:path*", "/cuenta/:path*", "/checkout/:path*"],
};
