import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { calcularPrecio, type Tarifa } from "@/lib/precios-calculo";
import type { MetodoEnvio } from "@/lib/validaciones/pedido";

/*
 * Cotización del carrito: SIEMPRE en el servidor, con precios y stock de la base.
 * La usan la página del carrito, el checkout y la acción que crea el pedido,
 * así los tres muestran exactamente los mismos números.
 */

const redondear = (n: number) => Math.round(Number((n * 100).toPrecision(12))) / 100;

export const getConfigEnvio = cache(async () => {
  const filas = await prisma.setting.findMany({ where: { clave: { in: ["costo_envio", "envio_gratis_desde", "datos_bancarios"] } } });
  const num = (clave: string, d: number) => {
    const n = Number(filas.find((f) => f.clave === clave)?.valor);
    return Number.isFinite(n) && n >= 0 ? n : d;
  };
  return {
    costoEnvio: num("costo_envio", 5),
    envioGratisDesde: num("envio_gratis_desde", 300),
    datosBancarios: filas.find((f) => f.clave === "datos_bancarios")?.valor ?? "",
  };
});

export type LineaCotizada = {
  productId: string;
  slug: string;
  nombre: string;
  codigo: string;
  imagen: string | null;
  stock: number;
  cantidad: number; // ya ajustada al stock
  unitarioSinIva: number; // precio cobrado (con descuento de distribuidor si aplica)
  unitarioConIva: number;
  totalLinea: number; // con IVA
};

export type Aviso = { productId: string; texto: string };

export async function cotizar(items: { productId: string; cantidad: number }[], tarifa: Tarifa, metodoEnvio: MetodoEnvio = "DOMICILIO") {
  // Une repetidos (por si el mismo producto llega dos veces).
  const pedidos = new Map<string, number>();
  for (const i of items) pedidos.set(i.productId, Math.min(99, (pedidos.get(i.productId) ?? 0) + i.cantidad));

  const [productos, envio] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: [...pedidos.keys()] }, estado: "PUBLICADO" },
      select: {
        id: true,
        slug: true,
        nombre: true,
        codigo: true,
        precioSinIva: true,
        stock: true,
        images: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
      },
    }),
    getConfigEnvio(),
  ]);

  const lineas: LineaCotizada[] = [];
  const avisos: Aviso[] = [];

  for (const [productId, pedida] of pedidos) {
    const p = productos.find((x) => x.id === productId);
    if (!p) {
      avisos.push({ productId, texto: "Un producto de tu carrito ya no está disponible y lo quitamos." });
      continue;
    }
    if (p.stock <= 0) {
      avisos.push({ productId, texto: `“${p.nombre}” se agotó y lo quitamos de tu carrito.` });
      continue;
    }
    const cantidad = Math.min(pedida, p.stock);
    if (cantidad < pedida) {
      avisos.push({ productId, texto: `Solo quedan ${p.stock} unidades de “${p.nombre}”; ajustamos la cantidad.` });
    }
    const precio = calcularPrecio(p.precioSinIva, tarifa);
    lineas.push({
      productId,
      slug: p.slug,
      nombre: p.nombre,
      codigo: p.codigo,
      imagen: p.images[0]?.url ?? null,
      stock: p.stock,
      cantidad,
      unitarioSinIva: precio.sinIva,
      unitarioConIva: precio.conIva,
      totalLinea: redondear(precio.conIva * cantidad),
    });
  }

  // Totales: el total de productos es la suma de lo que el cliente ve (precio con IVA × cantidad).
  const totalProductos = redondear(lineas.reduce((t, l) => t + l.totalLinea, 0));
  const subtotal = redondear(lineas.reduce((t, l) => t + l.unitarioSinIva * l.cantidad, 0));
  const iva = redondear(totalProductos - subtotal);
  const envioGratis = totalProductos >= envio.envioGratisDesde;
  const costoEnvio = lineas.length === 0 || metodoEnvio === "RETIRO" || envioGratis ? 0 : envio.costoEnvio;

  return {
    lineas,
    avisos,
    unidades: lineas.reduce((t, l) => t + l.cantidad, 0),
    subtotal,
    iva,
    totalProductos,
    envio: costoEnvio,
    envioGratis,
    faltaParaEnvioGratis: envioGratis ? 0 : redondear(envio.envioGratisDesde - totalProductos),
    total: redondear(totalProductos + costoEnvio),
    tarifa,
  };
}

export type Cotizacion = Awaited<ReturnType<typeof cotizar>>;
