import Image from "next/image";
import Link from "next/link";

// Diseño común de login, registro y recuperar contraseña.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-marca-navy via-marca-azul to-marca-cyan px-4 py-10">
      <Link href="/" className="mb-6 rounded-2xl bg-white px-5 py-3 shadow-md" aria-label="Volver a la tienda">
        <Image src="/logo-italcompu.webp" alt="ITALCOMPU - Vendemos soluciones" width={150} height={135} priority />
      </Link>
      <main className="w-full max-w-md">{children}</main>
      <p className="mt-6 text-sm text-white/80">© {new Date().getFullYear()} ITALCOMPU · Vendemos soluciones</p>
    </div>
  );
}
