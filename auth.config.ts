import type { NextAuthConfig } from "next-auth";
import type { Rol } from "@/lib/roles";

// Configuración que también usa el middleware (sin Prisma ni bcrypt).
// Los proveedores (email/contraseña) se agregan en auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 días
  providers: [],
  callbacks: {
    // Al iniciar sesión guardamos id y rol dentro del token.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rol = (user as { rol: Rol }).rol;
      }
      return token;
    },
    // Y los pasamos a la sesión que leen las páginas.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.rol = token.rol;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
