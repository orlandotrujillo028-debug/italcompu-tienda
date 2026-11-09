/**
 * Datos estructurados (JSON-LD) para Google: precio, stock, marca, migas, tienda.
 * Se escapa "<" para que ningún texto (por ejemplo, el nombre de un producto) pueda cerrar
 * la etiqueta <script> e inyectar código.
 */
export function JsonLd({ datos }: { datos: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
