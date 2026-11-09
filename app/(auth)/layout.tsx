import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoItalcompu } from "@/components/marca/logo-italcompu";
import { FondoTecnologico } from "@/components/auth/fondo-tecnologico";
import { TituloAuth } from "@/components/auth/titulo-auth";
import { IconoMarca } from "@/components/tienda/iconos";
import { getConfigTienda } from "@/lib/config-tienda";

// Diseño común de login, registro y recuperar contraseña:
// fondo tecnológico a pantalla completa, mensaje grande a la izquierda y formulario a la derecha.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfigTienda();
  const anio = new Date().getFullYear();
  const redes = [
    { marca: "whatsapp" as const, url: config.whatsappUrl, nombre: "WhatsApp" },
    { marca: "facebook" as const, url: config.redes.facebook, nombre: "Facebook" },
    { marca: "instagram" as const, url: config.redes.instagram, nombre: "Instagram" },
    { marca: "tiktok" as const, url: config.redes.tiktok, nombre: "TikTok" },
  ].filter((r) => r.url);

  return (
    <div className="relative isolate min-h-screen text-white">
      <FondoTecnologico className="-z-10" />

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-8">
        {/* Mensaje de marca */}
        <section className="space-y-8 text-center lg:text-left">
          <Link href="/" className="inline-block" aria-label="ITALCOMPU, volver a la tienda">
            <LogoItalcompu variante="completo" tono="claro" decorativo className="h-24 w-auto drop-shadow-[0_0_24px_rgba(18,180,230,0.35)] lg:h-32" />
          </Link>
          <TituloAuth />
          {redes.length > 0 && (
            <div className="hidden gap-3 lg:flex">
              {redes.map((r) => (
                <a
                  key={r.marca}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${r.nombre} de ITALCOMPU`}
                  className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 transition hover:border-marca-cyan hover:bg-marca-cyan/20 hover:text-white"
                >
                  <IconoMarca marca={r.marca} className="size-4" />
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Formulario */}
        <div className="w-full">
          <main className="auth-oscuro mx-auto w-full max-w-md">{children}</main>
          <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white">
              <ArrowLeft className="size-4" />
              Volver a la tienda
            </Link>
            {redes.length > 0 && (
              <div className="flex gap-3 lg:hidden">
                {redes.map((r) => (
                  <a
                    key={r.marca}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${r.nombre} de ITALCOMPU`}
                    className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-marca-cyan/20"
                  >
                    <IconoMarca marca={r.marca} className="size-4" />
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-white/55">© {anio} ITALCOMPU · Vendemos soluciones</p>
          </div>
        </div>
      </div>
    </div>
  );
}
