import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, CheckCircle2, Clock, FileText, Store, UserPlus } from "lucide-react";
import { PaginaInfo } from "@/components/info/pagina-info";
import { Button } from "@/components/ui/button";
import { getUsuarioActual } from "@/lib/auth-guards";
import { formatoPct } from "@/lib/formato";
import { getConfigPrecios } from "@/lib/precios";
import { TIPOS_NEGOCIO } from "@/lib/ecuador";

export const metadata: Metadata = {
  title: "Distribuidores",
  description: "¿Tienes un local de tecnología? Regístrate como distribuidor de ITALCOMPU y compra todo el catálogo a precio especial.",
};

const PREGUNTAS = [
  { p: "¿Quién puede ser distribuidor?", r: `Locales y empresas del mismo giro con RUC activo: ${TIPOS_NEGOCIO.filter((t) => t !== "Otro").join(", ").toLowerCase()}.` },
  { p: "¿Cuánto tardan en aprobarme?", r: "Revisamos tu RUC y los datos del local normalmente en 1 a 2 días hábiles. Te avisamos por WhatsApp o correo." },
  { p: "¿El descuento aplica a todo?", r: "Sí: ves todo el catálogo con tu precio de distribuidor apenas inicias sesión. Los precios incluyen IVA." },
  { p: "¿Hay un monto mínimo de compra?", r: "No. Compras lo que necesites, cuando lo necesites, con las mismas formas de pago y envío." },
];

export default async function DistribuidoresPage() {
  const [usuario, config] = await Promise.all([getUsuarioActual(), getConfigPrecios()]);
  const d = formatoPct(config.descuentoMaximo);
  const hay = config.descuentoMaximo > 0;
  const estado = usuario?.distribuidor?.estado;

  // Botón principal según quién está mirando.
  const accion =
    estado === "APROBADO"
      ? { texto: "Ya eres distribuidor: ver catálogo", href: "/", Icono: CheckCircle2 }
      : estado === "PENDIENTE"
        ? { texto: "Tu solicitud está en revisión", href: "/cuenta", Icono: Clock }
        : usuario?.rol === "CLIENTE"
          ? { texto: "Solicitar desde mi cuenta", href: "/cuenta/distribuidor", Icono: FileText }
          : usuario
            ? null // personal o admin
            : { texto: "Registrar mi local", href: "/registro-distribuidor", Icono: UserPlus };

  const pasos = [
    { Icono: UserPlus, titulo: "1. Regístrate", texto: "Llena los datos de tu local y tu RUC. Toma 2 minutos." },
    { Icono: Clock, titulo: "2. Revisamos", texto: "Validamos la información de tu negocio." },
    { Icono: BadgePercent, titulo: "3. Compra con descuento", texto: hay ? `Todo el catálogo hasta ${d} % más barato.` : "Precios especiales en todo el catálogo." },
  ];

  return (
    <PaginaInfo
      titulo="Programa de distribuidores"
      descripcion={`¿Tienes un local de tecnología? Compra a ITALCOMPU ${hay ? `con hasta ${d} % de descuento` : "a precio especial"} en todo el catálogo.`}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        {pasos.map(({ Icono, titulo, texto }) => (
          <div key={titulo} className="rounded-xl border bg-card p-4">
            <Icono className="mb-2 size-7 text-marca-azul" />
            <h2 className="font-semibold text-marca-navy">{titulo}</h2>
            <p className="text-sm text-marca-gris">{texto}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-marca-navy"><Store className="size-5 text-marca-cyan" /> Requisitos</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>RUC activo de tu negocio.</li>
            <li>Local físico o empresa del giro de tecnología.</li>
            <li>Un celular de contacto y un correo.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-marca-navy"><BadgePercent className="size-5 text-marca-cyan" /> Beneficios</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>{hay ? `Hasta ${d} % de descuento` : "Precio especial"} según la categoría, siempre visible al iniciar sesión.</li>
            <li>Atención prioritaria por WhatsApp.</li>
            <li>Mismos envíos, garantía y formas de pago que la tienda.</li>
          </ul>
        </div>
      </section>

      {accion && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-gradient-to-r from-marca-navy to-marca-azul p-6 text-center text-white">
          <p className="text-lg font-bold">¿Listo para empezar?</p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-marca-navy hover:bg-marca-fondo">
            <Link href={accion.href}><accion.Icono /> {accion.texto}</Link>
          </Button>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-marca-navy">Preguntas frecuentes</h2>
        {PREGUNTAS.map((q) => (
          <details key={q.p} className="group rounded-xl border bg-card p-4">
            <summary className="cursor-pointer list-none font-semibold text-marca-navy [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block text-marca-azul transition group-open:rotate-90">›</span>
              {q.p}
            </summary>
            <p className="mt-2 pl-5 text-sm text-marca-gris">{q.r}</p>
          </details>
        ))}
      </section>
    </PaginaInfo>
  );
}
