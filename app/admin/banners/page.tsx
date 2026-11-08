import type { Metadata } from "next";
import { BannersAdmin } from "@/components/admin/banners";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Banners" };

export default async function BannersPage() {
  await requireRole("ADMIN");
  const banners = await prisma.banner.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, titulo: true, subtitulo: true, imagen: true, enlace: true, orden: true, activo: true },
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca-navy">Banners del inicio</h1>
        <p className="text-sm text-marca-gris">Se muestran en el carrusel de la página de inicio, en el orden indicado. Usa imágenes de 1600×500 sin texto: el título se dibuja encima.</p>
      </div>
      <BannersAdmin banners={banners} />
    </div>
  );
}
