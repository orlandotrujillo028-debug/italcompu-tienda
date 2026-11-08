import { BarraSuperior } from "@/components/tienda/barra-superior";
import { Footer } from "@/components/tienda/footer";
import { Header } from "@/components/tienda/header";
import { MenuCategorias } from "@/components/tienda/menu-categorias";
import { WhatsAppFlotante } from "@/components/tienda/whatsapp-flotante";
import { getMenuCategorias } from "@/lib/catalogo";
import { getConfigTienda } from "@/lib/config-tienda";
import { getTarifa } from "@/lib/precios";

// Layout público de la tienda: barra superior, header, categorías, contenido, footer y WhatsApp.
export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const [config, categorias, tarifa] = await Promise.all([getConfigTienda(), getMenuCategorias(), getTarifa()]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded bg-white px-3 py-2 text-marca-navy focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <BarraSuperior config={config} esDistribuidor={tarifa.esDistribuidor} />
      <header className="sticky top-0 z-40 shadow-sm">
        <Header categorias={categorias} esDistribuidor={tarifa.esDistribuidor} />
        <MenuCategorias categorias={categorias} />
      </header>
      <div id="contenido" className="flex-1">
        {children}
      </div>
      <Footer config={config} />
      <WhatsAppFlotante url={config.whatsappUrl} />
    </div>
  );
}
