import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BeneficiosDistribuidor } from "@/components/distribuidor/beneficios";
import { SolicitudDistribuidorForm } from "@/components/distribuidor/solicitud-distribuidor-form";
import { requireRole } from "@/lib/auth-guards";
import { getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";
import type { DatosNegocioInput } from "@/lib/validaciones/auth";

export const metadata: Metadata = { title: "Solicitar ser distribuidor" };

export default async function SolicitarDistribuidorPage() {
  const usuario = await requireRole("CLIENTE");
  const estado = usuario.distribuidor?.estado;
  // Solo pueden llenar el formulario quienes no tienen solicitud o fueron rechazados.
  if (estado && estado !== "RECHAZADO") redirect("/cuenta");

  const [{ descuentoMaximo }, anterior] = await Promise.all([
    getConfigPrecios(),
    estado === "RECHAZADO" ? prisma.distributorProfile.findUnique({ where: { userId: usuario.id } }) : null,
  ]);

  const valores: Partial<DatosNegocioInput> | undefined = anterior
    ? {
        nombreLocal: anterior.nombreLocal,
        razonSocial: anterior.razonSocial,
        ruc: anterior.ruc,
        tipoNegocio: anterior.tipoNegocio as DatosNegocioInput["tipoNegocio"],
        provincia: anterior.provincia as DatosNegocioInput["provincia"],
        ciudad: anterior.ciudad,
        direccion: anterior.direccion ?? "",
        telefonoLocal: anterior.telefono,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/cuenta" className="text-sm text-marca-azul hover:underline">
          ← Volver a mi cuenta
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-marca-navy">Solicitar precios de distribuidor</h1>
        {anterior?.motivoRechazo && (
          <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Tu solicitud anterior no fue aprobada: {anterior.motivoRechazo}
          </p>
        )}
      </div>
      <BeneficiosDistribuidor descuento={descuentoMaximo} />
      <div className="rounded-xl border bg-card p-5">
        <SolicitudDistribuidorForm valores={valores} />
      </div>
    </div>
  );
}
