import { Bienvenida } from "@/components/paneles/panel-shell";
import { EstadoDistribuidor } from "@/components/distribuidor/estado-distribuidor";
import { requireUser } from "@/lib/auth-guards";
import { getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

export default async function CuentaInicio() {
  const usuario = await requireUser();
  const [pedidos, direcciones, deseos, config] = await Promise.all([
    prisma.order.count({ where: { userId: usuario.id } }),
    prisma.address.count({ where: { userId: usuario.id } }),
    prisma.wishlistItem.count({ where: { userId: usuario.id } }),
    getConfigPrecios(),
  ]);

  const tarjetas = [
    { titulo: "Mis pedidos", valor: pedidos },
    { titulo: "Direcciones guardadas", valor: direcciones },
    { titulo: "Lista de deseos", valor: deseos },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={usuario.name ?? "cliente"} texto="Aquí verás tus pedidos, direcciones y lista de deseos. El panel completo llega en el Paso 9." />
      {usuario.rol === "CLIENTE" && (
        <EstadoDistribuidor distribuidor={usuario.distribuidor} descuento={config.descuentoDistribuidor} />
      )}
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
