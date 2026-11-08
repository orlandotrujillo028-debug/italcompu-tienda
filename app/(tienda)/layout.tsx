import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";

// Header provisional de la tienda. En el Paso 5 se completa con buscador,
// carrito, menú de categorías y footer.
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" aria-label="ITALCOMPU, ir al inicio">
            <Image src="/logo-italcompu.webp" alt="ITALCOMPU" width={64} height={57} priority />
          </Link>
          <UserMenu />
        </div>
      </header>
      {children}
    </>
  );
}
