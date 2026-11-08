import type { Metadata } from "next";
import { FormClave, FormDatos } from "@/components/cuenta/formularios-datos";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mis datos" };

export default async function MisDatosPage() {
  const usuario = await requireUser();
  const datos = await prisma.user.findUniqueOrThrow({
    where: { id: usuario.id },
    select: { name: true, email: true, telefono: true, cedula: true, password: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-marca-navy">Mis datos</h1>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-bold text-marca-navy">Datos personales</h2>
        <FormDatos email={datos.email} valores={{ nombre: datos.name ?? "", telefono: datos.telefono ?? "", cedula: datos.cedula ?? "" }} />
      </section>

      {datos.password && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-bold text-marca-navy">Cambiar contraseña</h2>
          <FormClave />
        </section>
      )}
    </div>
  );
}
