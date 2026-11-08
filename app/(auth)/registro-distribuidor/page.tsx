import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BeneficiosDistribuidor } from "@/components/distribuidor/beneficios";
import { RegistroDistribuidorForm } from "@/components/distribuidor/registro-distribuidor-form";
import { getUsuarioActual } from "@/lib/auth-guards";
import { getConfigPrecios } from "@/lib/precios";
import { panelPorRol } from "@/lib/roles";

export const metadata: Metadata = { title: "Precios para distribuidores" };

export default async function RegistroDistribuidorPage() {
  // Si ya tiene cuenta, la solicitud se hace desde "Mi cuenta".
  const usuario = await getUsuarioActual();
  if (usuario) redirect(usuario.rol === "CLIENTE" ? "/cuenta/distribuidor" : panelPorRol(usuario.rol));

  const { descuentoDistribuidor } = await getConfigPrecios();

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-marca-navy">¿Tienes un local de tecnología?</CardTitle>
        <CardDescription>Regístrate como distribuidor y compra a precio especial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BeneficiosDistribuidor descuento={descuentoDistribuidor} />
        <RegistroDistribuidorForm />
        <p className="border-t pt-4 text-center text-sm text-marca-gris">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login?callbackUrl=%2Fcuenta%2Fdistribuidor" className="font-medium text-marca-azul hover:underline">
            Inicia sesión y solicítalo desde tu cuenta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
