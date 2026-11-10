import Link from "next/link";
import { ChevronRight, Heart, MapPin, Package, ShoppingBag, UserRound } from "lucide-react";
import { EstadoDistribuidor } from "@/components/distribuidor/estado-distribuidor";
import { Bienvenida } from "@/components/paneles/panel-shell";
import { EstadoBadge } from "@/components/pedidos/detalle-pedido";
import { requireUser } from "@/lib/auth-guards";
import { fechaEC, formatoUSD } from "@/lib/formato";
import { getConfigPrecios } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

export default async function CuentaInicio() {
  const usuario = await requireUser();
  const [ultimo, pedidos, direcciones, deseos, config] = await Promise.all([
    prisma.order.findFirst({
      where: { userId: usuario.id },
      orderBy: { createdAt: "desc" },
      select: { numero: true, estado: true, total: true, createdAt: true, _count: { select: { items: true } } },
    }),
    prisma.order.count({ where: { userId: usuario.id } }),
    prisma.address.count({ where: { userId: usuario.id } }),
    prisma.wishlistItem.count({ where: { userId: usuario.id } }),
    getConfigPrecios(),
  ]);

  const accesos = [
    { href: "/cuenta/pedidos", texto: "Mis pedidos", valor: pedidos, Icono: Package },
    { href: "/cuenta/direcciones", texto: "Direcciones", valor: direcciones, Icono: MapPin },
    { href: "/cuenta/deseos", texto: "Lista de deseos", valor: deseos, Icono: Heart },
    { href: "/cuenta/datos", texto: "Mis datos", valor: null, Icono: UserRound },
  ];

  return (
    <div className="space-y-6">
      <Bienvenida nombre={usuario.name ?? "cliente"} texto="Desde aquí sigues tus pedidos y administras tu cuenta." />

      {ultimo ? (
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-marca-navy">Tu último pedido</h2>
            <Link href="/cuenta/pedidos" className="text-sm font-medium text-marca-azul hover:underline">
              Ver todos
            </Link>
          </div>
          <Link href={`/cuenta/pedidos/${ultimo.numero}`} className="flex items-center gap-4 rounded-lg border p-3 hover:border-marca-cyan hover:bg-accent/40">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-marca-azul">
              <ShoppingBag className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-semibold text-marca-navy">
                Pedido #{ultimo.numero}
                <EstadoBadge estado={ultimo.estado} />
              </span>
              <span className="mt-0.5 block text-sm text-marca-gris">
                {fechaEC(ultimo.createdAt)} · {ultimo._count.items}{" "}
                {ultimo._count.items === 1 ? "producto" : "productos"} · <strong className="text-marca-azul">{formatoUSD(ultimo.total)}</strong>
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-marca-gris" />
          </Link>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-2 rounded-xl border bg-card p-8 text-center">
          <ShoppingBag className="size-10 text-marca-cyan" />
          <p className="font-semibold text-marca-navy">Aún no tienes pedidos</p>
          <Link href="/" className="text-sm font-medium text-marca-azul hover:underline">
            Ir a la tienda
          </Link>
        </section>
      )}

      {usuario.rol === "CLIENTE" && <EstadoDistribuidor distribuidor={usuario.distribuidor} descuento={config.descuentoMaximo} />}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {accesos.map(({ href, texto, valor, Icono }) => (
          <li key={href}>
            <Link href={href} className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition hover:border-marca-cyan hover:shadow-sm">
              <Icono className="size-5 text-marca-azul" />
              <span className="text-sm text-marca-gris">{texto}</span>
              {valor !== null && <span className="text-2xl font-bold text-marca-navy">{valor}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
