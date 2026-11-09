import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { contarIntento, ipDe, LIMITES, reiniciarIntentos } from "@/lib/limite";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validaciones/auth";

/** Error que el formulario muestra como "demasiados intentos" (en lugar de "clave incorrecta"). */
export class DemasiadosIntentos extends CredentialsSignin {
  code = "demasiados-intentos";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo" },
        password: { label: "Contraseña", type: "password" },
      },
      // El límite va AQUÍ (y no solo en el formulario) porque este paso también se puede
      // llamar directo en /api/auth/callback/credentials.
      async authorize(credenciales, request) {
        const datos = loginSchema.safeParse(credenciales);
        if (!datos.success) return null;
        const { email, password } = datos.data;

        const [porEmail, porIp] = await Promise.all([
          contarIntento(`login:email:${email}`, LIMITES.loginEmail),
          contarIntento(`login:ip:${ipDe(request.headers)}`, LIMITES.loginIp),
        ]);
        if (porEmail.bloqueado || porIp.bloqueado) throw new DemasiadosIntentos();

        const usuario = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, password: true, rol: true, activo: true },
        });
        // Mismo mensaje para "no existe", "desactivado" o "clave incorrecta": no damos pistas.
        if (!usuario || !usuario.activo || !usuario.password) return null;

        const claveCorrecta = await bcrypt.compare(password, usuario.password);
        if (!claveCorrecta) return null;

        await reiniciarIntentos(`login:email:${email}`); // entró bien: se limpia su contador
        return { id: usuario.id, name: usuario.name, email: usuario.email, rol: usuario.rol };
      },
    }),
  ],
});
