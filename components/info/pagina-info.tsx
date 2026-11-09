import { Migas } from "@/components/listado/migas";

/** Plantilla de las páginas informativas: migas, encabezado con degradado y contenido. */
export function PaginaInfo({
  titulo,
  descripcion,
  children,
  ancho = "angosto",
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  ancho?: "angosto" | "amplio";
}) {
  return (
    <main className={`mx-auto space-y-6 px-4 py-5 sm:py-6 ${ancho === "angosto" ? "max-w-4xl" : "max-w-7xl"}`}>
      <Migas items={[{ nombre: titulo }]} />
      <header className="rounded-2xl bg-gradient-to-r from-marca-navy via-marca-azul to-marca-cyan p-6 text-white shadow-md sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-4xl">{titulo}</h1>
        {descripcion && <p className="mt-2 max-w-2xl text-white/90 sm:text-lg">{descripcion}</p>}
      </header>
      {children}
    </main>
  );
}

/** Estilos de texto largo (títulos, párrafos, listas) sin necesidad de otro paquete. */
export function Prosa({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-4 rounded-xl border bg-card p-5 leading-relaxed text-foreground sm:p-8 [&_a]:font-medium [&_a]:text-marca-azul [&_a:hover]:underline [&_h2]:pt-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-marca-navy [&_h3]:font-semibold [&_h3]:text-marca-navy [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_strong]:text-marca-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
    >
      {children}
    </div>
  );
}

/** Aviso de texto de ejemplo (se ve solo mientras desarrollas, nunca en producción). */
export function AvisoEjemplo() {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <p className="rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      ✏️ Texto de ejemplo: revísalo y edítalo en el archivo de esta página antes de publicar la tienda (los textos legales, idealmente con un abogado).
    </p>
  );
}
