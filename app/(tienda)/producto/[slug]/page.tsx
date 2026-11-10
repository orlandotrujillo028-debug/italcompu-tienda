import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CheckCircle2, PackageCheck, ShieldCheck, Truck, AlertTriangle } from "lucide-react";
import { CarruselProductos, ItemCarrusel } from "@/components/home/carrusel-productos";
import { Migas } from "@/components/listado/migas";
import { JsonLd } from "@/components/seo/json-ld";
import { AccionesProducto } from "@/components/producto/acciones-producto";
import { BotonDeseo } from "@/components/producto/boton-deseo";
import { Galeria } from "@/components/producto/galeria";
import { Precio } from "@/components/producto/precio";
import { ProductCard } from "@/components/producto/product-card";
import { IconoMarca } from "@/components/tienda/iconos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIdsDeseos, type ProductoTarjeta } from "@/lib/catalogo";
import { getConfigTienda } from "@/lib/config-tienda";
import { formatoUSD } from "@/lib/formato";
import { calcularPrecio, getTarifa } from "@/lib/precios";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

const getProducto = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, estado: "PUBLICADO" },
    select: {
      id: true,
      slug: true,
      nombre: true,
      codigo: true,
      descripcion: true,
      specs: true,
      precioSinIva: true,
      precioDistribuidorSinIva: true,
      stock: true,
      garantiaMeses: true,
      destacado: true,
      nuevo: true,
      categoryId: true,
      brand: { select: { nombre: true, slug: true } },
      category: { select: { id: true, nombre: true, slug: true, parent: { select: { id: true, nombre: true, slug: true } } } },
      images: { orderBy: { orden: "asc" }, select: { url: true } },
    },
  }),
);

/** specs se guarda como [{ clave, valor }]; ignoramos cualquier cosa con otra forma. */
function leerSpecs(specs: unknown): { clave: string; valor: string }[] {
  if (!Array.isArray(specs)) return [];
  return specs.filter(
    (s): s is { clave: string; valor: string } => !!s && typeof s === "object" && typeof s.clave === "string" && typeof s.valor === "string",
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProducto((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  const descripcion = (p.descripcion ?? `${p.nombre}, código ${p.codigo}.`).slice(0, 160);
  return {
    title: p.nombre,
    description: descripcion,
    alternates: { canonical: `/producto/${p.slug}` },
    // Next reemplaza (no combina) el openGraph del layout, así que repetimos sitio e idioma.
    openGraph: {
      type: "website",
      siteName: "ITALCOMPU",
      locale: "es_EC",
      url: `/producto/${p.slug}`,
      title: p.nombre,
      description: descripcion,
      images: p.images[0] ? [{ url: p.images[0].url, alt: p.nombre }] : [{ url: "/logo-italcompu.webp" }],
    },
  };
}

async function getRelacionados(p: { id: string; categoryId: string; parentId?: string }): Promise<ProductoTarjeta[]> {
  const select = {
    id: true, slug: true, nombre: true, codigo: true, precioSinIva: true, precioDistribuidorSinIva: true, stock: true, destacado: true, nuevo: true,
    brand: { select: { nombre: true } },
    images: { orderBy: { orden: "asc" as const }, take: 1, select: { url: true } },
  };
  // Primero de la misma subcategoría; si son pocos, completa con la categoría principal.
  const mismos = await prisma.product.findMany({
    where: { estado: "PUBLICADO", categoryId: p.categoryId, id: { not: p.id } },
    orderBy: [{ stock: "desc" }, { destacado: "desc" }],
    take: 10,
    select,
  });
  const extra =
    mismos.length < 6 && p.parentId
      ? await prisma.product.findMany({
          where: { estado: "PUBLICADO", category: { parentId: p.parentId }, id: { notIn: [p.id, ...mismos.map((m) => m.id)] } },
          orderBy: [{ stock: "desc" }, { destacado: "desc" }],
          take: 10 - mismos.length,
          select,
        })
      : [];
  return [...mismos, ...extra].map((r) => ({
    id: r.id, slug: r.slug, nombre: r.nombre, codigo: r.codigo, precioSinIva: Number(r.precioSinIva),
    precioDistribuidorSinIva: Number(r.precioDistribuidorSinIva), stock: r.stock,
    destacado: r.destacado, nuevo: r.nuevo, marca: r.brand?.nombre ?? null, imagen: r.images[0]?.url ?? null,
  }));
}

export default async function ProductoPage({ params }: Props) {
  const p = await getProducto((await params).slug);
  if (!p) notFound();

  const padre = p.category.parent;
  const [tarifa, deseos, config, relacionados] = await Promise.all([
    getTarifa(),
    getIdsDeseos(),
    getConfigTienda(),
    getRelacionados({ id: p.id, categoryId: p.categoryId, parentId: padre?.id }),
  ]);

  const precio = calcularPrecio(p, tarifa);
  const specs = leerSpecs(p.specs);
  const agotado = p.stock <= 0;
  const whatsapp = config.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hola ITALCOMPU, me interesa: ${p.nombre} (código ${p.codigo}).`)}`
    : null;

  const migas = [
    ...(padre ? [{ nombre: padre.nombre, href: `/categoria/${padre.slug}` }] : []),
    { nombre: p.category.nombre, href: `/categoria/${p.category.slug}` },
    { nombre: p.nombre },
  ];

  // Datos para Google: SIEMPRE el precio público (nunca el de distribuidor del usuario que mira).
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const precioPublico = calcularPrecio(p.precioSinIva, { iva: tarifa.iva, esDistribuidor: false }).conIva;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      sku: p.codigo,
      mpn: p.codigo,
      image: p.images.map((i) => i.url),
      description: p.descripcion ?? p.nombre,
      ...(p.brand ? { brand: { "@type": "Brand", name: p.brand.nombre } } : {}),
      category: [padre?.nombre, p.category.nombre].filter(Boolean).join(" > "),
      offers: {
        "@type": "Offer",
        url: `${sitio}/producto/${p.slug}`,
        priceCurrency: "USD",
        price: precioPublico.toFixed(2),
        availability: agotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "ITALCOMPU" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ nombre: "Inicio", href: "/" }, ...migas].map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.nombre,
        ...("href" in m && m.href ? { item: `${sitio}${m.href}` } : {}),
      })),
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:py-6">
      <JsonLd datos={jsonLd} />
      <Migas items={migas} />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <Galeria imagenes={p.images.map((i) => i.url)} nombre={p.nombre} agotado={agotado} />

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {p.nuevo && <span className="rounded bg-marca-cyan px-2 py-0.5 text-xs font-bold text-marca-navy">Nuevo</span>}
              {p.destacado && <span className="rounded bg-marca-navy px-2 py-0.5 text-xs font-bold text-white">Destacado</span>}
            </div>
            <h1 className="text-2xl leading-tight font-bold text-marca-navy sm:text-3xl">{p.nombre}</h1>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-marca-gris">
              <span>
                Código: <strong className="text-foreground">{p.codigo}</strong>
              </span>
              {p.brand && (
                <span>
                  Marca:{" "}
                  <Link href={`/marca/${p.brand.slug}`} className="font-semibold text-marca-azul hover:underline">
                    {p.brand.nombre}
                  </Link>
                </span>
              )}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Precio producto={p} tarifa={tarifa} tamano="lg" />
              <BotonDeseo productId={p.id} inicial={deseos.has(p.id)} className="border" />
            </div>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border-t pt-3 text-sm">
              <dt className="text-marca-gris">Subtotal sin IVA</dt>
              <dd className="text-right">{formatoUSD(precio.sinIva)}</dd>
              <dt className="text-marca-gris">IVA ({tarifa.iva} %)</dt>
              <dd className="text-right">{formatoUSD(precio.conIva - precio.sinIva)}</dd>
              <dt className="font-semibold text-marca-navy">Total</dt>
              <dd className="text-right font-semibold text-marca-navy">{formatoUSD(precio.conIva)}</dd>
              {tarifa.esDistribuidor && precio.ahorro > 0 && (
                <>
                  <dt className="text-emerald-700">Tu ahorro como distribuidor</dt>
                  <dd className="text-right font-semibold text-emerald-700">{formatoUSD(precio.ahorro)}</dd>
                </>
              )}
            </dl>
          </div>

          <p className={`flex items-start gap-2 text-sm font-medium ${agotado ? "text-amber-800" : p.stock <= 5 ? "text-amber-700" : "text-emerald-700"}`}>
            {agotado ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
            {agotado
              ? "Sin stock en este momento. Escríbenos y te confirmamos si lo tenemos en otra sucursal o cuándo llega."
              : p.stock <= 5
                ? `¡Últimas ${p.stock} unidades!`
                : `Disponible (${p.stock} unidades)`}
          </p>

          <AccionesProducto productId={p.id} codigo={p.codigo} nombre={p.nombre} stock={p.stock} />

          {whatsapp && !agotado && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#25D366] font-medium text-[#0f7a6e] hover:bg-[#25D366]/10"
            >
              <IconoMarca marca="whatsapp" className="size-5" />
              Consultar por WhatsApp
            </a>
          )}

          <ul className="grid gap-2 text-sm text-marca-gris sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="size-4 text-marca-cyan" /> Envíos a todo Ecuador</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-marca-cyan" /> Garantía {p.garantiaMeses} meses</li>
            <li className="flex items-center gap-2"><PackageCheck className="size-4 text-marca-cyan" /> Original con factura</li>
          </ul>
        </section>
      </div>

      <Tabs defaultValue="descripcion" className="rounded-xl border bg-card p-4 sm:p-6">
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="descripcion">Descripción</TabsTrigger>
          <TabsTrigger value="specs">Especificaciones</TabsTrigger>
          <TabsTrigger value="garantia">Garantía</TabsTrigger>
        </TabsList>
        <TabsContent value="descripcion" className="pt-4 leading-relaxed whitespace-pre-line text-foreground">
          {p.descripcion || "Este producto aún no tiene descripción. Escríbenos por WhatsApp y te ayudamos."}
        </TabsContent>
        <TabsContent value="specs" className="pt-4">
          {specs.length ? (
            <table className="w-full max-w-2xl text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={`${s.clave}-${i}`} className="border-b last:border-0 odd:bg-marca-fondo">
                    <th scope="row" className="w-2/5 px-3 py-2 text-left font-medium text-marca-navy">{s.clave}</th>
                    <td className="px-3 py-2">{s.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-marca-gris">Sin especificaciones registradas.</p>
          )}
        </TabsContent>
        <TabsContent value="garantia" className="space-y-2 pt-4 text-foreground">
          <p>
            Este producto tiene <strong>{p.garantiaMeses} meses de garantía</strong> por defectos de fábrica, gestionada directamente por ITALCOMPU en Ecuador.
          </p>
          <p className="text-sm text-marca-gris">
            Conserva tu factura. La garantía no cubre golpes, humedad ni manipulación por terceros.{" "}
            <Link href="/politicas-de-garantia" className="font-medium text-marca-azul hover:underline">Ver políticas de garantía</Link>
          </p>
        </TabsContent>
      </Tabs>

      {relacionados.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-marca-navy sm:text-2xl">Productos relacionados</h2>
          <CarruselProductos etiqueta="Productos relacionados">
            {relacionados.map((r) => (
              <ItemCarrusel key={r.id}>
                <ProductCard producto={r} tarifa={tarifa} enDeseos={deseos.has(r.id)} />
              </ItemCarrusel>
            ))}
          </CarruselProductos>
        </section>
      )}
    </main>
  );
}
