// REEMPLAZA el catálogo de prueba por el inventario real de la sucursal.
// Uso:  npm run inventario:reemplazar -- "C:\ruta\inventario.xls"
//
// ⚠️ Borra TODOS los productos, pedidos, listas de deseos y marcas actuales (son datos de prueba)
//    y deja solo los productos del Excel. Usuarios, configuración, banners y categorías se conservan.
//    Pide confirmación escribiendo BORRAR. Para las actualizaciones del día a día NO uses este script:
//    sube el Excel en Admin → Inventario (compara y actualiza sin borrar nada).
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";
import { leerInventarioExcel } from "../lib/inventario/leer-excel";
import { aplicarCarga, guardarCarga } from "../lib/inventario/sincronizar";

const prisma = new PrismaClient({ transactionOptions: { maxWait: 10_000, timeout: 60_000 } });

async function main() {
  const ruta = process.argv[2];
  if (!ruta) throw new Error('Indica el archivo: npm run inventario:reemplazar -- "C:\\ruta\\inventario.xls"');
  const leido = leerInventarioExcel(readFileSync(ruta));
  const [productos, pedidos] = await Promise.all([prisma.product.count(), prisma.order.count()]);
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/:?]+)/)?.[1] ?? "?";

  console.log(`\nExcel: ${leido.filas.length} productos de "${leido.sucursal}".`);
  console.log(`Base de datos: ${host}`);
  console.log(`Se BORRARÁN ${productos} productos y ${pedidos} pedidos actuales (y listas de deseos y marcas).\n`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = (await rl.question('Escribe BORRAR para continuar: ')).trim();
  rl.close();
  if (respuesta !== "BORRAR") {
    console.log("Cancelado. No se cambió nada.");
    return;
  }

  console.log("Borrando datos de prueba…");
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.brand.deleteMany(),
  ]);
  // El próximo pedido real vuelve a ser el #1001.
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Order"', 'numero'), 1000, true)`);

  console.log("Guardando el inventario y creando los productos…");
  const cargaId = await guardarCarga(prisma, leido, basename(ruta), null);
  const r = await aplicarCarga(prisma, cargaId);
  const publicados = await prisma.product.count({ where: { estado: "PUBLICADO" } });
  console.log(`✅ Listo: ${r.crear} productos creados (${publicados} publicados).`);
}

main()
  .catch((e) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
