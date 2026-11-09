import type { Metadata } from "next";
import Link from "next/link";
import { AvisoEjemplo, PaginaInfo, Prosa } from "@/components/info/pagina-info";
import { getConfigTienda } from "@/lib/config-tienda";
import { EMPRESA } from "@/lib/empresa";
import { formatoUSD } from "@/lib/formato";
import { getConfigEnvio } from "@/lib/pedido";
import { getConfigPrecios } from "@/lib/precios";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso y de compra de la tienda en línea de ITALCOMPU.",
};

// ✏️ TEXTO DE EJEMPLO: debe revisarlo un abogado antes de publicar la tienda.
export default async function TerminosPage() {
  const [config, envio, precios] = await Promise.all([getConfigTienda(), getConfigEnvio(), getConfigPrecios()]);

  return (
    <PaginaInfo titulo="Términos y condiciones" descripcion="Las reglas para usar esta tienda y comprar en ITALCOMPU.">
      <AvisoEjemplo />
      <Prosa>
        <p>
          Estos términos regulan el uso de la tienda en línea de {EMPRESA.razonSocial} (“{EMPRESA.nombreComercial}”), RUC {EMPRESA.ruc}, con domicilio en{" "}
          {EMPRESA.ciudad}, Ecuador. Al crear una cuenta o hacer un pedido aceptas estos términos, junto con nuestra{" "}
          <Link href="/proteccion-de-datos">política de protección de datos</Link> y nuestras <Link href="/politicas-de-garantia">políticas de garantía</Link>.
        </p>

        <h2>1. Cuenta</h2>
        <p>
          Eres responsable de mantener tu contraseña en reserva y de la información que registras. Podemos suspender cuentas que den datos falsos o hagan un uso
          indebido de la tienda.
        </p>

        <h2>2. Precios e IVA</h2>
        <ul>
          <li>Los precios están en dólares de los Estados Unidos (USD) e <strong>incluyen el IVA</strong> vigente ({precios.iva} %).</li>
          <li>Los precios y la disponibilidad pueden cambiar sin previo aviso; se respeta el precio que figura en tu pedido confirmado.</li>
          <li>
            Los <strong>distribuidores aprobados</strong> ven precios con un descuento especial. Ese beneficio puede suspenderse si la información del negocio
            deja de ser válida.
          </li>
          <li>Si por un error evidente un producto se publica con un precio equivocado, te contactaremos para confirmar o anular el pedido sin costo.</li>
        </ul>

        <h2>3. Cómo se hace un pedido</h2>
        <ol>
          <li>Agregas productos al carrito y eliges la forma de entrega y de pago.</li>
          <li>Al pulsar “Enviar pedido por WhatsApp” registramos tu pedido, reservamos el stock y se abre WhatsApp con el detalle.</li>
          <li>Te respondemos para confirmar disponibilidad, el pago y la entrega. El pedido se despacha cuando el pago está confirmado (salvo contra entrega).</li>
        </ol>
        <p>Podemos cancelar pedidos que no se paguen en un plazo razonable; en ese caso el stock reservado vuelve a estar disponible.</p>

        <h2>4. Formas de pago</h2>
        <ul>
          <li><strong>Transferencia o depósito</strong> a las cuentas indicadas al confirmar el pedido.</li>
          <li><strong>Tarjeta de crédito o débito</strong> mediante un enlace de pago seguro que te enviamos por WhatsApp.</li>
          <li><strong>Contra entrega</strong> o pago al retirar, donde esté disponible.</li>
        </ul>

        <h2>5. Envíos</h2>
        <ul>
          <li>Enviamos a todo Ecuador con courier (por ejemplo, Servientrega). El costo del envío es {formatoUSD(envio.costoEnvio)} y es gratis desde {formatoUSD(envio.envioGratisDesde)}.</li>
          <li>También puedes retirar gratis en nuestra matriz{config.direccion ? `: ${config.direccion}` : ""}.</li>
          <li>Los tiempos de entrega son estimados y dependen del courier y del destino.</li>
        </ul>

        <h2>6. Devoluciones y garantía</h2>
        <p>
          Se rigen por nuestras <Link href="/politicas-de-garantia">políticas de garantía</Link> y por la Ley Orgánica de Defensa del Consumidor, incluido el
          derecho de devolución en compras por internet dentro de los 3 días siguientes a recibir el producto.
        </p>

        <h2>7. Propiedad intelectual</h2>
        <p>
          La marca {EMPRESA.nombreComercial}, el logo, los textos y el diseño de esta tienda nos pertenecen. Las marcas de los productos pertenecen a sus
          respectivos fabricantes.
        </p>

        <h2>8. Ley aplicable y reclamos</h2>
        <p>
          Estos términos se rigen por las leyes del Ecuador. Antes de cualquier otra vía, escríbenos a {config.email || "nuestro correo de contacto"} para buscar
          una solución. También puedes acudir a la Defensoría del Pueblo u otros organismos de protección al consumidor.
        </p>

        <p className="text-sm text-marca-gris">Última actualización: {EMPRESA.actualizacionLegal}.</p>
      </Prosa>
    </PaginaInfo>
  );
}
