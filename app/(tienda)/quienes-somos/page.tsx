import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, Eye, HeartHandshake, ShieldCheck, Target, Truck, Wrench } from "lucide-react";
import { AvisoEjemplo, PaginaInfo } from "@/components/info/pagina-info";
import { Button } from "@/components/ui/button";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "¿Quiénes somos?",
  description: "ITALCOMPU: tecnología para tu hogar, tu oficina y tu negocio en Ecuador. Vendemos soluciones.",
};

// ✏️ TEXTO DE EJEMPLO: cambia la historia, misión, visión y valores por los reales de ITALCOMPU.
const VALORES = [
  { Icono: ShieldCheck, titulo: "Productos originales", texto: "Trabajamos con marcas reconocidas y entregamos factura y garantía local en cada compra." },
  { Icono: HeartHandshake, titulo: "Asesoría honesta", texto: "Te recomendamos lo que de verdad necesitas, según tu uso y tu presupuesto." },
  { Icono: Wrench, titulo: "Soporte después de la venta", texto: "Nuestro servicio técnico te acompaña con garantías, mantenimiento y reparaciones." },
  { Icono: Truck, titulo: "Envíos a todo el país", texto: "Despachamos a las 24 provincias del Ecuador con courier de confianza." },
];

export default function QuienesSomosPage() {
  const anios = new Date().getFullYear() - EMPRESA.desde;

  return (
    <PaginaInfo titulo="¿Quiénes somos?" descripcion="Vendemos soluciones: tecnología confiable para tu hogar, tu oficina y tu negocio.">
      <AvisoEjemplo />

      <section className="grid gap-6 rounded-xl border bg-card p-5 sm:p-8 md:grid-cols-[1fr_220px] md:items-center">
        <div className="space-y-3 leading-relaxed">
          <h2 className="text-xl font-bold text-marca-navy">Nuestra historia</h2>
          <p>
            {EMPRESA.nombreComercial} nació en {EMPRESA.ciudad} en {EMPRESA.desde} con una idea simple: que comprar tecnología sea fácil, seguro y sin sorpresas.
            Empezamos armando computadores a la medida y hoy ofrecemos laptops, componentes, impresión, redes, energía y mucho más.
          </p>
          <p>
            Atendemos a familias, estudiantes, profesionales y empresas, y trabajamos de la mano con locales de tecnología de todo el país a través de nuestro
            programa de distribuidores.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-marca-navy to-marca-azul p-6 text-center text-white">
          <span className="text-5xl font-extrabold">+{anios}</span>
          <span className="text-sm text-white/90">años vendiendo soluciones</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-marca-navy"><Target className="size-5 text-marca-cyan" /> Misión</h2>
          <p className="leading-relaxed">Brindar soluciones tecnológicas confiables, con asesoría cercana y precios justos, para que cada cliente trabaje, estudie y emprenda mejor.</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-marca-navy"><Eye className="size-5 text-marca-cyan" /> Visión</h2>
          <p className="leading-relaxed">Ser la tienda de tecnología de referencia en Ecuador por la calidad de nuestros productos y la confianza de nuestro servicio.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca-navy">Lo que nos distingue</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {VALORES.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="flex gap-3 rounded-xl border bg-card p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-marca-azul"><Icono className="size-5" /></span>
              <span>
                <span className="block font-semibold text-marca-navy">{titulo}</span>
                <span className="text-sm text-marca-gris">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-semibold text-marca-navy"><BadgePercent className="size-5 text-marca-cyan" /> ¿Tienes un local de tecnología? Trabajemos juntos.</p>
        <div className="flex gap-2">
          <Button asChild><Link href="/distribuidores">Ser distribuidor</Link></Button>
          <Button asChild variant="outline"><Link href="/contacto">Contáctanos</Link></Button>
        </div>
      </section>
    </PaginaInfo>
  );
}
