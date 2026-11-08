import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistroVendedorForm } from "@/components/auth/registro-vendedor-form";
import { getUsuarioActual } from "@/lib/auth-guards";
import { panelPorRol } from "@/lib/roles";

export const metadata: Metadata = { title: "Vende con nosotros" };

export default async function RegistroVendedorPage() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect(panelPorRol(usuario.rol));

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">Vende con ITALCOMPU</CardTitle>
        <CardDescription>
          Registra tu tienda. Nuestro equipo revisará tu solicitud y, cuando la aprobemos, podrás publicar tus productos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegistroVendedorForm />
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
