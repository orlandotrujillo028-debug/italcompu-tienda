import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FormContacto } from "@/components/info/form-contacto";
import { PaginaInfo } from "@/components/info/pagina-info";
import { IconoMarca } from "@/components/tienda/iconos";
import { getConfigTienda } from "@/lib/config-tienda";
import { SUCURSALES } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Contacto y sucursales",
  description: "Escríbenos por WhatsApp, llámanos o visítanos. Direcciones y horarios de ITALCOMPU.",
};

/** Mapa de Google sin clave de API (búsqueda por dirección). Se carga solo al llegar a él. */
function Mapa({ consulta, titulo }: { consulta: string; titulo: string }) {
  return (
    <iframe
      title={`Mapa: ${titulo}`}
      src={`https://www.google.com/maps?q=${encodeURIComponent(consulta)}&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="aspect-[4/3] w-full rounded-lg border-0 sm:aspect-video"
    />
  );
}

export default async function ContactoPage() {
  const config = await getConfigTienda();
  const sucursales = SUCURSALES.map((s, i) => ({
    ...s,
    // La matriz (o cualquier sucursal sin dirección) usa la dirección y el horario de la Configuración.
    direccion: s.direccion || (i === 0 ? config.direccion : ""),
    telefono: s.telefono || (i === 0 ? config.telefono : undefined),
    horario: s.horario || (i === 0 ? config.horario : undefined),
  })).filter((s) => s.direccion);

  const canales = [
    config.whatsapp && { Icono: null, texto: `+${config.whatsapp}`, detalle: "WhatsApp (respuesta más rápida)", href: `https://wa.me/${config.whatsapp}` },
    config.telefono && { Icono: Phone, texto: config.telefono, detalle: "Teléfono", href: `tel:${config.telefono.replace(/\s/g, "")}` },
    config.email && { Icono: Mail, texto: config.email, detalle: "Correo", href: `mailto:${config.email}` },
    config.horario && { Icono: Clock, texto: config.horario, detalle: "Horario de atención", href: null },
  ].filter(Boolean) as { Icono: typeof Phone | null; texto: string; detalle: string; href: string | null }[];

  return (
    <PaginaInfo titulo="Contacto y sucursales" descripcion="Estamos para ayudarte: escríbenos, llámanos o visítanos." ancho="amplio">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canales.map(({ Icono, texto, detalle, href }) => {
          const contenido = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-marca-azul">
                {Icono ? <Icono className="size-5" /> : <IconoMarca marca="whatsapp" className="size-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-marca-gris">{detalle}</span>
                <span className="block font-semibold break-words text-marca-navy">{texto}</span>
              </span>
            </>
          );
          return (
            <li key={detalle}>
              {href ? (
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex h-full items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-marca-cyan">
                  {contenido}
                </a>
              ) : (
                <div className="flex h-full items-center gap-3 rounded-xl border bg-card p-4">{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-marca-navy">{sucursales.length > 1 ? "Nuestras sucursales" : "Visítanos"}</h2>
          {sucursales.length === 0 && <p className="text-marca-gris">Agrega la dirección de la matriz en Admin → Configuración.</p>}
          {sucursales.map((s) => (
            <article key={s.nombre} className="space-y-3 rounded-xl border bg-card p-4">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-marca-navy"><MapPin className="size-5 text-marca-cyan" /> {s.nombre}</h3>
                <p className="text-sm">{s.direccion}</p>
                <p className="text-sm text-marca-gris">
                  {[s.telefono, s.horario].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Mapa titulo={s.nombre} consulta={s.mapa || `${s.direccion}, ${s.ciudad}, Ecuador`} />
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapa || `${s.direccion}, ${s.ciudad}, Ecuador`)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-marca-azul hover:underline">
                Abrir en Google Maps (cómo llegar)
              </a>
            </article>
          ))}
        </section>

        {config.whatsapp && (
          <section className="h-fit space-y-3 rounded-xl border bg-card p-5 lg:sticky lg:top-40">
            <h2 className="text-xl font-bold text-marca-navy">Escríbenos</h2>
            <p className="text-sm text-marca-gris">Completa el mensaje y se abrirá WhatsApp para enviarlo. Te respondemos en horario de atención.</p>
            <FormContacto whatsapp={config.whatsapp} />
          </section>
        )}
      </div>
    </PaginaInfo>
  );
}
