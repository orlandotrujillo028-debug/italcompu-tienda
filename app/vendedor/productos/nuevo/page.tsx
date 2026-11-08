import type { Metadata } from "next";
import Link from "next/link";
import { ProductoForm } from "@/components/vendedor/producto-form";
import { requireRole } from "@/lib/auth-guards";
import { datosFormularioProducto, siguienteCodigo } from "../datos-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const usuario = await requireRole("VENDEDOR", "ADMIN");
  const [datos, codigo] = await Promise.all([datosFormularioProducto(), siguienteCodigo()]);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/vendedor/productos" className="text-sm text-marca-azul hover:underline">← Productos</Link>
        <h1 className="mt-1 text-2xl font-bold text-marca-navy">Nuevo producto</h1>
      </div>
      <ProductoForm
        {...datos}
        esAdmin={usuario.rol === "ADMIN"}
        inicial={{ codigo, nombre: "", categoryId: "", brandId: "", precioSinIva: "", stock: 0, garantiaMeses: 12, descripcion: "", specs: [], imagenes: [] }}
      />
    </div>
  );
}
