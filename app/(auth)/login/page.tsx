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
    <Card>
      <CardHeader className="gap-1.5">
        <CardTitle className="text-2xl font-bold tracking-tight text-marca-navy">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa con tu correo y contraseña para continuar.</CardDescription>
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
            ¿Tienes un local de tecnología?{" "}
            <Link href="/registro-distribuidor" className="font-medium text-marca-azul hover:underline">
              Precios de distribuidor
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
