import { Bienvenida } from "@/components/paneles/panel-shell";
import { requireVendedorAprobado } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function VendedorInicio() {
  const vendedor = await requireVendedorAprobado();
  const [publicados, pendientes, stockBajo] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendedor.vendorProfile.id, estado: "PUBLICADO" } }),
    prisma.product.count({ where: { vendorId: vendedor.vendorProfile.id, estado: "PENDIENTE" } }),
    prisma.product.count({ where: { vendorId: vendedor.vendorProfile.id, stock: { lte: 5 } } }),
  ]);

  const tarjetas = [
    { titulo: "Productos publicados", valor: publicados },
    { titulo: "Esperando aprobación", valor: pendientes },
    { titulo: "Con stock bajo (≤ 5)", valor: stockBajo },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={vendedor.name ?? "Vendedor"} texto="Este es el panel de tu tienda. El dashboard completo llega en el Paso 10." />
      <div className="grid gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-marca-gris">{t.titulo}</p>
            <p className="mt-1 text-3xl font-bold text-marca-navy">{t.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
