import type { Metadata } from "next";
import { BadgePercent, FileSpreadsheet, FolderTree, History, Image as ImageIcon, LayoutDashboard, Package, Settings, ShoppingBag, Store, Users } from "lucide-react";
import { NavPanel, type ItemNav } from "@/components/paneles/nav-panel";
import { PanelShell } from "@/components/paneles/panel-shell";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: { default: "Administración", template: "%s | Admin ITALCOMPU" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN"); // segunda barrera, con datos frescos de la base

  // Contadores para avisar al admin qué tiene pendiente.
  const [productos, distribuidores, transferencias] = await Promise.all([
    prisma.product.count({ where: { estado: "PENDIENTE" } }),
    prisma.distributorProfile.count({ where: { estado: "PENDIENTE" } }),
    prisma.order.count({ where: { estado: "PENDIENTE_PAGO", metodoPago: "TRANSFERENCIA" } }),
  ]);
  const conAviso = (texto: string, n: number) => (n > 0 ? `${texto} (${n})` : texto);

  const items: ItemNav[] = [
    { href: "/admin", texto: "Dashboard", icono: <LayoutDashboard />, exacto: true },
    { href: "/admin/productos", texto: conAviso("Aprobar productos", productos), icono: <Package /> },
    { href: "/vendedor/pedidos?estado=PENDIENTE_PAGO", texto: conAviso("Pedidos", transferencias), icono: <ShoppingBag /> },
    { href: "/admin/distribuidores", texto: conAviso("Distribuidores", distribuidores), icono: <BadgePercent /> },
    { href: "/admin/usuarios", texto: "Usuarios", icono: <Users /> },
    { href: "/admin/inventario", texto: "Inventario", icono: <FileSpreadsheet /> },
    { href: "/admin/catalogo", texto: "Categorías y marcas", icono: <FolderTree /> },
    { href: "/admin/banners", texto: "Banners", icono: <ImageIcon /> },
    { href: "/admin/configuracion", texto: "Configuración", icono: <Settings /> },
    { href: "/admin/actividad", texto: "Actividad", icono: <History /> },
    { href: "/vendedor", texto: "Panel de ventas", icono: <Store /> },
  ];

  return (
    <PanelShell titulo="Administración">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <NavPanel items={items} titulo="Secciones de administración" />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PanelShell>
  );
}
