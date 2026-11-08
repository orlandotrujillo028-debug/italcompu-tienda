import Link from "next/link";
import { BadgePercent, Phone } from "lucide-react";
import { IconoMarca } from "@/components/tienda/iconos";
import type { ConfigTienda } from "@/lib/config-tienda";

/** Franja superior: enlaces informativos, aviso de distribuidor y redes sociales. */
export function BarraSuperior({ config, esDistribuidor }: { config: ConfigTienda; esDistribuidor: boolean }) {
  const redes = [
    { marca: "whatsapp" as const, url: config.whatsappUrl, nombre: "WhatsApp" },
    { marca: "instagram" as const, url: config.redes.instagram, nombre: "Instagram" },
    { marca: "facebook" as const, url: config.redes.facebook, nombre: "Facebook" },
    { marca: "tiktok" as const, url: config.redes.tiktok, nombre: "TikTok" },
  ].filter((r) => r.url);

  return (
    <div className="bg-marca-navy text-xs text-white/85">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4">
        <nav className="flex items-center gap-4" aria-label="Enlaces de la empresa">
          <Link href="/quienes-somos" className="hover:text-white">
            ¿Quiénes somos?
          </Link>
          {esDistribuidor ? (
            <span className="flex items-center gap-1 font-medium text-marca-cyan">
              <BadgePercent className="size-3.5" />
              Precios de distribuidor activos
            </span>
          ) : (
            <Link href="/registro-distribuidor" className="hidden items-center gap-1 hover:text-white sm:flex">
              <BadgePercent className="size-3.5 text-marca-cyan" />
              ¿Tienes un local? Sé distribuidor
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {config.telefono && (
            <a href={`tel:${config.telefono.replace(/\s/g, "")}`} className="hidden items-center gap-1 hover:text-white md:flex">
              <Phone className="size-3.5" />
              {config.telefono}
            </a>
          )}
          {redes.map((r) => (
            <a
              key={r.marca}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${r.nombre} de ITALCOMPU`}
              className="rounded p-0.5 hover:text-marca-cyan"
            >
              <IconoMarca marca={r.marca} className="size-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
