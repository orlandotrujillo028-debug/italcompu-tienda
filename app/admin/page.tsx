import { Bienvenida } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function AdminInicio() {
  const admin = await requireRole("ADMIN");
  const [productosPendientes, distribuidoresPendientes, distribuidores, clientes] = await Promise.all([
    prisma.product.count({ where: { estado: "PENDIENTE" } }),
    prisma.distributorProfile.count({ where: { estado: "PENDIENTE" } }),
    prisma.distributorProfile.count({ where: { estado: "APROBADO" } }),
    prisma.user.count({ where: { rol: "CLIENTE" } }),
  ]);

  const tarjetas = [
    { titulo: "Productos por aprobar", valor: productosPendientes },
    { titulo: "Distribuidores por aprobar", valor: distribuidoresPendientes },
    { titulo: "Distribuidores activos", valor: distribuidores },
    { titulo: "Clientes registrados", valor: clientes },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={admin.name ?? "Admin"} texto="Panel de administración de ITALCOMPU. El dashboard completo llega en el Paso 11." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
