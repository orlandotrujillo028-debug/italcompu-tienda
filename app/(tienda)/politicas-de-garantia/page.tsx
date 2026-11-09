import type { Metadata } from "next";
import Link from "next/link";
import { AvisoEjemplo, PaginaInfo, Prosa } from "@/components/info/pagina-info";
import { getConfigTienda } from "@/lib/config-tienda";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Políticas de garantía",
  description: "Cómo funciona la garantía de los productos comprados en ITALCOMPU y cómo solicitarla.",
};

// ✏️ TEXTO DE EJEMPLO: revisa los plazos y condiciones con tu equipo y un abogado antes de publicar.
export default async function GarantiaPage() {
  const config = await getConfigTienda();

  return (
    <PaginaInfo titulo="Políticas de garantía" descripcion="Todos nuestros productos son originales, con factura y garantía en Ecuador.">
      <AvisoEjemplo />
      <Prosa>
        <p>
          En {EMPRESA.nombreComercial} queremos que compres con tranquilidad. Esta política explica qué cubre la garantía, por cuánto tiempo y cómo
          solicitarla, de acuerdo con la Ley Orgánica de Defensa del Consumidor del Ecuador.
        </p>

        <h2>1. Plazo de garantía</h2>
        <p>
          Cada producto indica su tiempo de garantía en la ficha del producto (pestaña “Garantía”). Si no se indica otro, la garantía es de <strong>12 meses</strong>{" "}
          contados desde la fecha de la factura. Algunos fabricantes ofrecen una garantía propia, que se gestiona en sus centros autorizados.
        </p>

        <h2>2. Qué cubre</h2>
        <ul>
          <li>Defectos de fabricación y fallas de funcionamiento en uso normal.</li>
          <li>La reparación del producto o, si no es posible repararlo, su cambio por uno igual o equivalente.</li>
        </ul>

        <h2>3. Qué no cubre</h2>
        <ul>
          <li>Golpes, caídas, humedad, líquidos, fuego o daños por variaciones de voltaje.</li>
          <li>Equipos abiertos, manipulados o reparados por terceros, o con sellos de garantía rotos.</li>
          <li>Desgaste normal de consumibles: tintas, tóner, baterías (salvo defecto de fábrica) y accesorios.</li>
          <li>Virus, software de terceros, pérdida de información o configuraciones del usuario.</li>
        </ul>

        <h2>4. Cómo solicitar la garantía</h2>
        <ol>
          <li>Escríbenos por WhatsApp{config.whatsapp ? ` (+${config.whatsapp})` : ""} o al correo {config.email || "de contacto"} con tu número de pedido o factura y una descripción de la falla.</li>
          <li>Trae el producto a nuestra matriz{config.direccion ? ` (${config.direccion})` : ""} con su caja, accesorios y factura, o coordinamos el envío.</li>
          <li>Nuestro servicio técnico lo revisa y te informa el diagnóstico. El tiempo de revisión depende del fabricante (normalmente de 8 a 15 días hábiles).</li>
        </ol>
        <p>Te recomendamos respaldar tu información antes de entregar cualquier equipo.</p>

        <h2>5. Devoluciones por compras en línea</h2>
        <p>
          Según el artículo 45 de la Ley Orgánica de Defensa del Consumidor, si compraste por internet tienes derecho a devolver el producto dentro de los{" "}
          <strong>3 días</strong> siguientes a recibirlo, en las mismas condiciones en que lo recibiste: sin uso, con su empaque, accesorios y factura.
          El costo de envío de la devolución lo cubre el cliente, salvo que el producto haya llegado con fallas o no corresponda a lo pedido.
        </p>

        <h2>6. Productos que llegan dañados</h2>
        <p>
          Revisa tu pedido al recibirlo. Si el empaque llegó golpeado o el producto no coincide con tu compra, escríbenos dentro de las 48 horas
          con fotos y tu número de pedido para solucionarlo de inmediato.
        </p>

        <p className="text-sm text-marca-gris">
          Más información en nuestros <Link href="/terminos">términos y condiciones</Link> y en <Link href="/servicio-tecnico">servicio técnico</Link>. Última actualización: {EMPRESA.actualizacionLegal}.
        </p>
      </Prosa>
    </PaginaInfo>
  );
}
