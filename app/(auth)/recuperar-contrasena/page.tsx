import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconoMarca } from "@/components/tienda/iconos";
import { getConfigTienda } from "@/lib/config-tienda";

export const metadata: Metadata = { title: "Recuperar contraseña" };

/**
 * Mientras no haya correos automáticos (Resend), la contraseña se recupera por WhatsApp:
 * el cliente escribe desde aquí y el admin le crea una temporal en Admin → Usuarios → "Nueva contraseña".
 * Cuando se configure Resend, volver a usar <RecuperarForm /> (components/auth/recuperar-form.tsx).
 */
export default async function RecuperarPage() {
  const config = await getConfigTienda();
  const whatsapp = config.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent("Hola ITALCOMPU, olvidé mi contraseña de la tienda en línea. Mi correo registrado es: ")}`
    : null;

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">Recuperar contraseña</CardTitle>
        <CardDescription>
          Escríbenos desde el WhatsApp de tu cuenta con el correo con el que te registraste. Te enviamos una contraseña temporal
          y luego la cambias en <strong>Mi cuenta → Mis datos</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0f7a6e] font-medium text-white hover:bg-[#075e54]"
          >
            <IconoMarca marca="whatsapp" className="size-5" />
            Pedir una contraseña nueva por WhatsApp
          </a>
        )}
        {config.email && (
          <a
            href={`mailto:${config.email}?subject=${encodeURIComponent("Olvidé mi contraseña")}`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border font-medium text-marca-navy hover:bg-accent"
          >
            <Mail className="size-4" /> O escríbenos a {config.email}
          </a>
        )}
        <p className="text-xs text-marca-gris">Por tu seguridad, solo atendemos el pedido si coincide con los datos de tu cuenta.</p>
        <p className="border-t pt-4 text-center text-sm text-marca-gris">
          <Link href="/login" className="font-medium text-marca-azul hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
