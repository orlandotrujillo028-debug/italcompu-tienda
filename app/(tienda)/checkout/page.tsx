import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/checkout";
import { Migas } from "@/components/listado/migas";
import { requireUser } from "@/lib/auth-guards";
import { getConfigTienda } from "@/lib/config-tienda";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

// El middleware ya exige sesión en /checkout; requireUser revisa de nuevo con datos frescos.
export default async function CheckoutPage() {
  const usuario = await requireUser();
  const [direcciones, tienda] = await Promise.all([
    prisma.address.findMany({
      where: { userId: usuario.id },
      orderBy: [{ principal: "desc" }, { id: "desc" }],
      select: { id: true, nombre: true, telefono: true, provincia: true, ciudad: true, direccion: true, referencia: true, principal: true },
    }),
    getConfigTienda(),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
      <Migas items={[{ nombre: "Carrito", href: "/carrito" }, { nombre: "Finalizar compra" }]} />
      <h1 className="text-2xl font-bold text-marca-navy sm:text-3xl">Finalizar compra</h1>
      <Checkout direcciones={direcciones} nombreUsuario={usuario.name ?? ""} tienda={{ direccion: tienda.direccion, horario: tienda.horario }} />
    </main>
  );
}
