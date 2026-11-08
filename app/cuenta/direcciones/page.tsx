import type { Metadata } from "next";
import { ListaDirecciones } from "@/components/cuenta/lista-direcciones";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mis direcciones" };

export default async function DireccionesPage() {
  const usuario = await requireUser();
  const direcciones = await prisma.address.findMany({
    where: { userId: usuario.id },
    orderBy: [{ principal: "desc" }, { id: "desc" }],
    select: { id: true, nombre: true, telefono: true, provincia: true, ciudad: true, direccion: true, referencia: true, principal: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca-navy">Mis direcciones</h1>
        <p className="text-sm text-marca-gris">La dirección principal se elige por defecto al comprar. Puedes guardar hasta 10.</p>
      </div>
      <ListaDirecciones direcciones={direcciones} nombreUsuario={usuario.name ?? ""} />
    </div>
  );
}
