import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecuperarForm } from "@/components/auth/recuperar-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">Recuperar contraseña</CardTitle>
        <CardDescription>Escribe tu correo y te enviaremos un enlace para crear una nueva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RecuperarForm />
        <p className="border-t pt-4 text-center text-sm text-marca-gris">
          <Link href="/login" className="font-medium text-marca-azul hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
