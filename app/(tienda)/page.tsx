import { Sparkles, Star } from "lucide-react";
import { CarruselBanners } from "@/components/home/carrusel-banners";
import { Beneficios, InvitacionDistribuidor } from "@/components/home/franjas";
import { GridCategorias } from "@/components/home/grid-categorias";
import { Vitrina, VitrinaCategoria } from "@/components/home/vitrina";
import { getUsuarioActual } from "@/lib/auth-guards";
import { getBannersActivos, getIdsDeseos, getMenuCategorias, getVitrinasHome } from "@/lib/catalogo";
import { getConfigPrecios, getTarifa } from "@/lib/precios";
import { JsonLd } from "@/components/seo/json-ld";
import { getConfigTienda } from "@/lib/config-tienda";
import { EMPRESA } from "@/lib/empresa";

// Página de inicio de la tienda.
export default async function Home() {
  const [banners, categorias, vitrinas, tarifa, deseos, usuario, config, tienda] = await Promise.all([
    getBannersActivos(),
    getMenuCategorias(),
    getVitrinasHome(),
    getTarifa(),
    getIdsDeseos(),
    getUsuarioActual(),
    getConfigPrecios(),
    getConfigTienda(),
  ]);

  // Datos de la tienda para Google (aparecen en búsquedas como "ITALCOMPU Quito").
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: "ITALCOMPU",
    slogan: "Vendemos soluciones",
    url: sitio,
    logo: `${sitio}/logo-italcompu.webp`,
    image: `${sitio}/logo-italcompu.webp`,
    ...(tienda.telefono ? { telephone: tienda.telefono } : {}),
    ...(tienda.email ? { email: tienda.email } : {}),
    ...(tienda.direccion ? { address: { "@type": "PostalAddress", streetAddress: tienda.direccion, addressLocality: EMPRESA.ciudad, addressCountry: "EC" } } : {}),
    currenciesAccepted: "USD",
    sameAs: Object.values(tienda.redes).filter((u) => /^https:\/\/[^/]+\/.+/.test(u)), // solo perfiles reales, no "https://facebook.com/"
    potentialAction: { "@type": "SearchAction", target: `${sitio}/buscar?q={q}`, "query-input": "required name=q" },
  };
  const comun = { tarifa, deseos };
  // La invitación a distribuidor solo tiene sentido para visitantes y clientes que aún no lo son.
  const invitar = !tarifa.esDistribuidor && (!usuario || usuario.rol === "CLIENTE");

  // La invitación se intercala después de la segunda vitrina de categoría.
  const [primeras, resto] = [vitrinas.secciones.slice(0, 2), vitrinas.secciones.slice(2)];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-5 sm:space-y-12 sm:py-6">
      <JsonLd datos={jsonLd} />
      <h1 className="sr-only">ITALCOMPU: tienda de tecnología en Ecuador</h1>

      <div className="space-y-4">
        <CarruselBanners banners={banners} />
        <Beneficios />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca-navy sm:text-2xl">Compra por categoría</h2>
        <GridCategorias categorias={categorias.map(({ id, nombre, slug, icono }) => ({ id, nombre, slug, icono }))} />
      </section>

      <Vitrina titulo="Destacados" icono={<Star className="size-6 fill-marca-cyan text-marca-cyan" />} productos={vitrinas.destacados} {...comun} />

      {primeras.map((s) => (
        <VitrinaCategoria key={s.id} categoria={s} {...comun} />
      ))}

      {invitar && <InvitacionDistribuidor descuento={config.descuentoDistribuidor} />}

      {resto.map((s) => (
        <VitrinaCategoria key={s.id} categoria={s} {...comun} />
      ))}

      <Vitrina
        titulo="Nuevos productos"
        icono={<Sparkles className="size-6 text-marca-cyan" />}
        href="/nuevos"
        productos={vitrinas.nuevos}
        {...comun}
      />
    </main>
  );
}
