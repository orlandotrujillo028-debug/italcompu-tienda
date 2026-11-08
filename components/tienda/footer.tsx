import Image from "next/image";
import Link from "next/link";
import { Banknote, Clock, CreditCard, HandCoins, Mail, MapPin, Phone, Truck } from "lucide-react";
import { IconoMarca } from "@/components/tienda/iconos";
import type { ConfigTienda } from "@/lib/config-tienda";

const COLUMNAS = [
  {
    titulo: "Sitios",
    enlaces: [
      { href: "/quienes-somos", texto: "¿Quiénes somos?" },
      { href: "/servicio-tecnico", texto: "Servicio técnico" },
      { href: "/distribuidores", texto: "Distribuidores" },
      { href: "/contacto", texto: "Contacto y sucursales" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { href: "/politicas-de-garantia", texto: "Políticas de garantía" },
      { href: "/proteccion-de-datos", texto: "Protección de datos" },
      { href: "/terminos", texto: "Términos y condiciones" },
    ],
  },
];

const PAGOS = [
  { Icono: CreditCard, texto: "Tarjeta de crédito y débito" },
  { Icono: Banknote, texto: "Transferencia bancaria" },
  { Icono: HandCoins, texto: "Pago contra entrega" },
  { Icono: Truck, texto: "Envíos a todo Ecuador" },
];

export function Footer({ config }: { config: ConfigTienda }) {
  const redes = [
    { marca: "whatsapp" as const, url: config.whatsappUrl, nombre: "WhatsApp" },
    { marca: "instagram" as const, url: config.redes.instagram, nombre: "Instagram" },
    { marca: "facebook" as const, url: config.redes.facebook, nombre: "Facebook" },
    { marca: "tiktok" as const, url: config.redes.tiktok, nombre: "TikTok" },
  ].filter((r) => r.url);

  return (
    <footer className="mt-16 bg-marca-navy text-sm text-white/80">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr_1.3fr]">
        <div className="col-span-2 space-y-4 lg:col-span-1">
          <Link href="/" className="inline-block rounded-xl bg-white p-2" aria-label="ITALCOMPU, ir al inicio">
            <Image src="/logo-italcompu.webp" alt="ITALCOMPU" width={110} height={99} />
          </Link>
          <p className="max-w-xs text-white/70">Tecnología para tu hogar, tu oficina y tu negocio. Vendemos soluciones.</p>
          <div className="flex gap-2">
            {redes.map((r) => (
              <a
                key={r.marca}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${r.nombre} de ITALCOMPU`}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-marca-cyan"
              >
                <IconoMarca marca={r.marca} className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNAS.map((col) => (
          <nav key={col.titulo} aria-label={col.titulo}>
            <h2 className="mb-3 font-semibold tracking-wide text-white uppercase">{col.titulo}</h2>
            <ul className="space-y-2">
              {col.enlaces.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="hover:text-marca-cyan">
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 sm:col-span-1">
          <h2 className="mb-3 font-semibold tracking-wide text-white uppercase">Contacto</h2>
          <ul className="space-y-2.5">
            {config.direccion && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-marca-cyan" />
                {config.direccion}
              </li>
            )}
            {config.telefono && (
              <li>
                <a href={`tel:${config.telefono.replace(/\s/g, "")}`} className="flex gap-2 hover:text-marca-cyan">
                  <Phone className="mt-0.5 size-4 shrink-0 text-marca-cyan" />
                  {config.telefono}
                </a>
              </li>
            )}
            {config.email && (
              <li>
                <a href={`mailto:${config.email}`} className="flex gap-2 break-all hover:text-marca-cyan">
                  <Mail className="mt-0.5 size-4 shrink-0 text-marca-cyan" />
                  {config.email}
                </a>
              </li>
            )}
            {config.horario && (
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-marca-cyan" />
                {config.horario}
              </li>
            )}
          </ul>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <h2 className="mb-3 font-semibold tracking-wide text-white uppercase">Pagos y envíos</h2>
          <ul className="space-y-2.5">
            {PAGOS.map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-2">
                <Icono className="size-4 shrink-0 text-marca-cyan" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} ITALCOMPU. Todos los derechos reservados.</p>
          <p>Precios en dólares (USD) · Precio incluye IVA</p>
        </div>
      </div>
    </footer>
  );
}
