import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { BotonComprar } from "@/components/producto/boton-comprar";
import { BotonConsultar } from "@/components/producto/boton-consultar";
import { BotonDeseo } from "@/components/producto/boton-deseo";
import { Precio } from "@/components/producto/precio";
import type { ProductoTarjeta } from "@/lib/catalogo";
import type { Tarifa } from "@/lib/precios-calculo";

/** Tarjeta de producto reutilizable (home, categorías, búsqueda, deseos). */
export function ProductCard({
  producto,
  tarifa,
  enDeseos,
  prioridad = false,
}: {
  producto: ProductoTarjeta;
  tarifa: Tarifa;
  enDeseos: boolean;
  prioridad?: boolean;
}) {
  const agotado = producto.stock <= 0;
  const href = `/producto/${producto.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-marca-cyan/60 hover:shadow-lg">
      <div className="relative aspect-square bg-white">
        <Link href={href} tabIndex={-1} aria-hidden>
          {producto.imagen ? (
            <Image
              src={producto.imagen}
              alt=""
              fill
              priority={prioridad}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              className="object-contain p-3 transition group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-marca-gris">
              <ImageOff className="size-10" />
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          {agotado && <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Consultar stock</span>}
          {producto.nuevo && <span className="rounded bg-marca-cyan px-2 py-0.5 text-[11px] font-bold text-marca-navy">Nuevo</span>}
          {producto.destacado && <span className="rounded bg-marca-navy px-2 py-0.5 text-[11px] font-bold text-white">Destacado</span>}
        </div>

        <BotonDeseo productId={producto.id} inicial={enDeseos} className="absolute top-2 right-2" />
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t p-3">
        {producto.marca && <p className="text-[11px] font-semibold tracking-wide text-marca-gris uppercase">{producto.marca}</p>}
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium text-foreground">
          <Link href={href} className="hover:text-marca-azul">
            {producto.nombre}
          </Link>
        </h3>
        <p className="text-xs text-marca-gris">Código: {producto.codigo}</p>
        <div className="mt-auto space-y-2.5 pt-1">
          <Precio producto={producto} tarifa={tarifa} />
          {agotado ? <BotonConsultar codigo={producto.codigo} /> : <BotonComprar productId={producto.id} nombre={producto.nombre} />}
        </div>
      </div>
    </article>
  );
}
