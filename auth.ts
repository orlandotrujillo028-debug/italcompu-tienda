import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validaciones/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales) {
        const datos = loginSchema.safeParse(credenciales);
        if (!datos.success) return null;

        const usuario = await prisma.user.findUnique({
          where: { email: datos.data.email },
          select: { id: true, name: true, email: true, password: true, rol: true, activo: true },
        });
        // Mismo mensaje para "no existe", "desactivado" o "clave incorrecta": no damos pistas.
        if (!usuario || !usuario.activo || !usuario.password) return null;

        const claveCorrecta = await bcrypt.compare(datos.data.password, usuario.password);
        if (!claveCorrecta) return null;

        return { id: usuario.id, name: usuario.name, email: usuario.email, rol: usuario.rol };
      },
    }),
  ],
});
