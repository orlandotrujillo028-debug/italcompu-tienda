import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";

/**
 * Marco común de los paneles (admin, vendedor, cliente).
 * En los pasos 9, 10 y 11 se agrega el menú lateral de cada panel.
 */
export function PanelShell({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-marca-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg bg-white p-1" aria-label="Ir a la tienda">
              <Image src="/logo-italcompu.webp" alt="ITALCOMPU" width={44} height={40} />
            </Link>
            <span className="text-lg font-semibold">{titulo}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white sm:flex"
            >
              <Store className="size-4" />
              Ver tienda
            </Link>
            <UserMenu tono="oscuro" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

/** Tarjeta de bienvenida provisional de cada panel. */
export function Bienvenida({ nombre, texto }: { nombre: string; texto: string }) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-marca-navy via-marca-azul to-marca-cyan p-6 text-white shadow-md">
      <h1 className="text-2xl font-bold">Hola, {nombre.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-white/90">{texto}</p>
    </section>
  );
}
