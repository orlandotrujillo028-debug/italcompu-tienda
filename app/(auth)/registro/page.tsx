import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistroForm } from "@/components/auth/registro-form";
import { getUsuarioActual } from "@/lib/auth-guards";
import { destinoTrasLogin } from "@/lib/roles";

export const metadata: Metadata = { title: "Crear cuenta" };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function RegistroPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const usuario = await getUsuarioActual();
  if (usuario) redirect(destinoTrasLogin(usuario.rol, callbackUrl));

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">Crear cuenta</CardTitle>
        <CardDescription>Regístrate para comprar y seguir tus pedidos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegistroForm callbackUrl={callbackUrl} />
        <p className="border-t pt-4 text-center text-sm text-marca-gris">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-marca-azul hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
