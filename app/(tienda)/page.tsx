import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Página temporal: se reemplaza por la home real en el Paso 6.
export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4 text-center">
      <Image
        src="/logo-italcompu.webp"
        alt="ITALCOMPU - Vendemos soluciones"
        width={320}
        height={287}
        priority
      />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-marca-navy sm:text-4xl">
          Tienda en construcción
        </h1>
        <p className="text-marca-gris">
          Muy pronto: laptops, computadores, componentes y mucho más.
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="lg">Ver productos</Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/registro-distribuidor">¿Tienes un local? Sé distribuidor</Link>
        </Button>
      </div>
      <div className="flex gap-2" aria-hidden>
        <span className="h-2 w-10 rounded-full bg-marca-navy" />
        <span className="h-2 w-10 rounded-full bg-marca-azul" />
        <span className="h-2 w-10 rounded-full bg-marca-cyan" />
        <span className="h-2 w-10 rounded-full bg-marca-gris" />
      </div>
    </main>
  );
}
