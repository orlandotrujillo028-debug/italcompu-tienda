import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, HardDrive, Laptop, Printer, Router, ShieldCheck } from "lucide-react";
import { AvisoEjemplo, PaginaInfo } from "@/components/info/pagina-info";
import { IconoMarca } from "@/components/tienda/iconos";
import { getConfigTienda } from "@/lib/config-tienda";

export const metadata: Metadata = {
  title: "Servicio técnico",
  description: "Mantenimiento, reparación, garantías y armado de equipos en ITALCOMPU.",
};

// ✏️ TEXTO DE EJEMPLO: ajusta la lista a los servicios que realmente ofreces.
const SERVICIOS = [
  { Icono: Laptop, titulo: "Mantenimiento de laptops y PC", texto: "Limpieza interna, cambio de pasta térmica y optimización del sistema." },
  { Icono: Cpu, titulo: "Armado y actualización", texto: "Armamos tu PC a la medida o mejoramos la que tienes (RAM, SSD, tarjeta de video)." },
  { Icono: HardDrive, titulo: "Respaldo y recuperación", texto: "Migración a SSD, respaldo de información e instalación de sistema operativo." },
  { Icono: Printer, titulo: "Impresoras", texto: "Instalación de tinta continua, limpieza de cabezales y configuración en red." },
  { Icono: Router, titulo: "Redes y cámaras", texto: "Instalación de WiFi, cableado estructurado y cámaras de seguridad." },
  { Icono: ShieldCheck, titulo: "Garantías", texto: "Recibimos y gestionamos la garantía de los productos que compraste con nosotros." },
];

export default async function ServicioTecnicoPage() {
  const config = await getConfigTienda();
  const whatsapp = config.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent("Hola ITALCOMPU, necesito servicio técnico para mi equipo.")}`
    : null;

  return (
    <PaginaInfo titulo="Servicio técnico" descripcion="Te ayudamos a que tu tecnología funcione como el primer día.">
      <AvisoEjemplo />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICIOS.map(({ Icono, titulo, texto }) => (
          <li key={titulo} className="rounded-xl border bg-card p-4">
            <Icono className="mb-2 size-7 text-marca-azul" />
            <h2 className="font-semibold text-marca-navy">{titulo}</h2>
            <p className="text-sm text-marca-gris">{texto}</p>
          </li>
        ))}
      </ul>

      <section className="space-y-3 rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-marca-navy">¿Cómo funciona?</h2>
        <ol className="list-decimal space-y-1 pl-6">
          <li>Escríbenos por WhatsApp contándonos qué le pasa a tu equipo.</li>
          <li>Te damos un diagnóstico inicial y una cotización sin compromiso.</li>
          <li>Trae tu equipo a nuestra matriz{config.direccion ? ` (${config.direccion})` : ""} o coordinamos el retiro.</li>
          <li>Te avisamos cuando esté listo. Todos nuestros trabajos tienen garantía.</li>
        </ol>
        <p className="text-sm text-marca-gris">
          Para garantías de productos comprados en la tienda, ten a mano tu factura o número de pedido. Lee las <Link href="/politicas-de-garantia" className="font-medium text-marca-azul hover:underline">políticas de garantía</Link>.
        </p>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0f7a6e] px-5 font-semibold text-white hover:bg-[#075e54]">
            <IconoMarca marca="whatsapp" className="size-5" /> Agendar por WhatsApp
          </a>
        )}
      </section>
    </PaginaInfo>
  );
}
