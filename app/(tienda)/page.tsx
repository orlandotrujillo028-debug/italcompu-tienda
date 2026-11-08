import { Sparkles, Star } from "lucide-react";
import { CarruselBanners } from "@/components/home/carrusel-banners";
import { Beneficios, InvitacionDistribuidor } from "@/components/home/franjas";
import { GridCategorias } from "@/components/home/grid-categorias";
import { Vitrina, VitrinaCategoria } from "@/components/home/vitrina";
import { getUsuarioActual } from "@/lib/auth-guards";
import { getBannersActivos, getIdsDeseos, getMenuCategorias, getVitrinasHome } from "@/lib/catalogo";
import { getConfigPrecios, getTarifa } from "@/lib/precios";

// Página de inicio de la tienda.
export default async function Home() {
  const [banners, categorias, vitrinas, tarifa, deseos, usuario, config] = await Promise.all([
    getBannersActivos(),
    getMenuCategorias(),
    getVitrinasHome(),
    getTarifa(),
    getIdsDeseos(),
    getUsuarioActual(),
    getConfigPrecios(),
  ]);
  const comun = { tarifa, deseos };
  // La invitación a distribuidor solo tiene sentido para visitantes y clientes que aún no lo son.
  const invitar = !tarifa.esDistribuidor && (!usuario || usuario.rol === "CLIENTE");

  // La invitación se intercala después de la segunda vitrina de categoría.
  const [primeras, resto] = [vitrinas.secciones.slice(0, 2), vitrinas.secciones.slice(2)];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-5 sm:space-y-12 sm:py-6">
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
