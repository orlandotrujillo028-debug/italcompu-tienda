import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getUsuarioActual } from "@/lib/auth-guards";
import { destinoTrasLogin } from "@/lib/roles";

export const metadata: Metadata = { title: "Iniciar sesión" };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  // Si ya tiene sesión válida, lo mandamos directo a su panel.
  const usuario = await getUsuarioActual();
  if (usuario) redirect(destinoTrasLogin(usuario.rol, callbackUrl));

  const registro = callbackUrl ? `/registro?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/registro";

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa con tu correo y contraseña.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm callbackUrl={callbackUrl} />
        <div className="space-y-2 border-t pt-4 text-center text-sm text-marca-gris">
          <p>
            ¿No tienes cuenta?{" "}
            <Link href={registro} className="font-medium text-marca-azul hover:underline">
              Regístrate
            </Link>
          </p>
          <p>
            ¿Quieres vender con nosotros?{" "}
            <Link href="/registro-vendedor" className="font-medium text-marca-azul hover:underline">
              Registra tu tienda
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
