import Image from "next/image";
import Link from "next/link";

/** 404 de respaldo (fuera de la tienda). Normalmente se usa el de app/(tienda)/not-found.tsx. */
export default function NoEncontradoRaiz() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <Image src="/logo-italcompu.webp" alt="ITALCOMPU" width={140} height={126} />
      <p className="text-6xl font-extrabold text-marca-azul">404</p>
      <h1 className="text-2xl font-bold text-marca-navy">No encontramos esta página</h1>
      <Link href="/" className="rounded-lg bg-marca-azul px-5 py-2.5 font-semibold text-white hover:bg-marca-navy">
        Ir a la tienda
      </Link>
    </main>
  );
}
