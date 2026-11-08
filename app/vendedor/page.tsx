import { Bienvenida } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function VendedorInicio() {
  const vendedor = await requireRole("VENDEDOR", "ADMIN");
  const [publicados, pendientes, stockBajo, pedidosPorAtender] = await Promise.all([
    prisma.product.count({ where: { estado: "PUBLICADO" } }),
    prisma.product.count({ where: { estado: "PENDIENTE" } }),
    prisma.product.count({ where: { estado: "PUBLICADO", stock: { lte: 5 } } }),
    prisma.order.count({ where: { estado: { in: ["PAGADO", "PREPARANDO"] } } }),
  ]);

  const tarjetas = [
    { titulo: "Pedidos por atender", valor: pedidosPorAtender },
    { titulo: "Productos publicados", valor: publicados },
    { titulo: "Esperando aprobación", valor: pendientes },
    { titulo: "Con stock bajo (≤ 5)", valor: stockBajo },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={vendedor.name ?? "Vendedor"} texto="Panel del personal de ITALCOMPU. Productos y pedidos completos llegan en el Paso 10." />
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
