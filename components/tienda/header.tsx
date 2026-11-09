import { LogoItalcompu } from "@/components/marca/logo-italcompu";
import Link from "next/link";
import { Heart } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { Buscador } from "@/components/tienda/buscador";
import { CarritoBoton } from "@/components/tienda/carrito-boton";
import { MenuMovil } from "@/components/tienda/menu-movil";
import type { CategoriaMenu } from "@/lib/catalogo";

/** Header principal: logo, buscador, deseos, carrito y usuario. */
export function Header({ categorias, esDistribuidor }: { categorias: CategoriaMenu[]; esDistribuidor: boolean }) {
  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:flex-nowrap lg:gap-6 lg:py-3">
        <MenuMovil categorias={categorias} esDistribuidor={esDistribuidor} />

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ITALCOMPU, ir al inicio">
          <LogoItalcompu decorativo className="h-11 w-auto lg:h-12" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-extrabold tracking-tight text-marca-navy">
              ITAL<span className="text-marca-azul">COMPU</span>
            </span>
            <span className="block text-[10px] font-semibold tracking-[0.2em] text-marca-gris uppercase">Vendemos soluciones</span>
          </span>
        </Link>

        {/* En escritorio el buscador va en medio; en móvil baja a una fila completa. */}
        <Buscador className="order-last w-full lg:order-none lg:flex-1" />

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link
            href="/cuenta/deseos"
            className="flex size-10 items-center justify-center rounded-lg text-marca-navy hover:bg-muted"
            aria-label="Lista de deseos"
          >
            <Heart className="size-5" />
          </Link>
          <CarritoBoton />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
