import type { Metadata } from "next";
import { AvisoEjemplo, PaginaInfo, Prosa } from "@/components/info/pagina-info";
import { getConfigTienda } from "@/lib/config-tienda";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Protección de datos personales",
  description: "Cómo ITALCOMPU trata tus datos personales conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.",
};

// ✏️ TEXTO DE EJEMPLO basado en la LOPDP del Ecuador. Debe revisarlo un abogado antes de publicar.
export default async function ProteccionDatosPage() {
  const config = await getConfigTienda();
  const correo = EMPRESA.correoDatosPersonales || config.email || "nuestro correo de contacto";

  return (
    <PaginaInfo titulo="Protección de datos personales" descripcion="Tus datos son tuyos. Te contamos qué datos usamos, para qué y cómo ejercer tus derechos.">
      <AvisoEjemplo />
      <Prosa>
        <p>
          Esta política explica cómo {EMPRESA.razonSocial} (“{EMPRESA.nombreComercial}”), con RUC {EMPRESA.ruc} y domicilio en {EMPRESA.ciudad}, Ecuador, trata
          los datos personales de quienes usan esta tienda, conforme a la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong>, publicada en
          el Registro Oficial (Quinto Suplemento) N.º 459 del 26 de mayo de 2021, y su reglamento.
        </p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          El responsable es {EMPRESA.razonSocial}. Para cualquier consulta sobre tus datos escríbenos a <strong>{correo}</strong>.
        </p>

        <h2>2. Qué datos recopilamos</h2>
        <ul>
          <li><strong>De tu cuenta:</strong> nombre, correo electrónico, contraseña (guardada cifrada; nunca la vemos), celular y cédula o RUC si los ingresas.</li>
          <li><strong>De tus compras:</strong> direcciones de entrega, productos, montos, forma de pago y número de guía del envío.</li>
          <li><strong>De distribuidores:</strong> razón social, nombre comercial, RUC, tipo de negocio y ubicación del local.</li>
          <li><strong>Técnicos:</strong> la información mínima que tu navegador guarda para mantener tu sesión y tu carrito.</li>
        </ul>
        <p>No recopilamos datos de tarjetas de crédito o débito: los pagos con tarjeta se hacen mediante un enlace de pago de un proveedor autorizado.</p>

        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Crear y administrar tu cuenta.</li>
          <li>Procesar tus pedidos, emitir la factura, coordinar el pago y la entrega (incluido el contacto por WhatsApp que tú inicias).</li>
          <li>Atender garantías, reclamos y consultas.</li>
          <li>Evaluar solicitudes de distribuidor y aplicar sus precios.</li>
          <li>Cumplir obligaciones legales y tributarias.</li>
        </ul>
        <p>
          La base legal es la ejecución del contrato de compra y el cumplimiento de obligaciones legales. Si en el futuro te enviamos promociones, lo haremos
          solo con tu consentimiento, que podrás retirar en cualquier momento.
        </p>

        <h2>4. Con quién los compartimos</h2>
        <p>
          Solo con quienes necesitamos para darte el servicio: el courier que entrega tu pedido (nombre, dirección y teléfono), el proveedor de pagos cuando pagas
          con tarjeta, nuestros proveedores de infraestructura (alojamiento de la tienda y base de datos) y las autoridades cuando la ley lo exija.{" "}
          <strong>No vendemos tus datos.</strong>
        </p>

        <h2>5. Cuánto tiempo los guardamos</h2>
        <p>
          Mientras tengas tu cuenta activa y, después, solo el tiempo necesario para cumplir obligaciones tributarias, contables y de garantía. Luego se eliminan
          o se anonimizan.
        </p>

        <h2>6. Tus derechos</h2>
        <p>La LOPDP te reconoce, entre otros, los derechos de:</p>
        <ul>
          <li><strong>Información y acceso:</strong> saber qué datos tuyos tenemos y cómo los usamos.</li>
          <li><strong>Rectificación y actualización:</strong> corregir datos inexactos (puedes hacerlo tú mismo en “Mi cuenta → Mis datos”).</li>
          <li><strong>Eliminación:</strong> pedir que borremos tus datos cuando ya no sean necesarios.</li>
          <li><strong>Oposición</strong> y <strong>suspensión del tratamiento</strong> en los casos que establece la ley.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en un formato común.</li>
          <li><strong>No ser objeto de decisiones automatizadas</strong> que te afecten sin intervención humana.</li>
        </ul>
        <p>
          Para ejercerlos escríbenos a <strong>{correo}</strong> indicando tu nombre, tu correo registrado y qué solicitas. Responderemos dentro de los plazos
          que establece la LOPDP. Si consideras que tus derechos no fueron atendidos, puedes acudir a la <strong>Superintendencia de Protección de Datos Personales</strong>.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Protegemos tu información con conexiones cifradas (HTTPS), contraseñas cifradas, acceso restringido por roles para nuestro personal y registros
          de actividad de las acciones administrativas.
        </p>

        <h2>8. Cambios a esta política</h2>
        <p>Si la cambiamos, publicaremos la nueva versión en esta página con su fecha de actualización.</p>

        <p className="text-sm text-marca-gris">Última actualización: {EMPRESA.actualizacionLegal}.</p>
      </Prosa>
    </PaginaInfo>
  );
}
