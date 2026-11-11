// RESPALDO de toda la base de datos en un archivo JSON (catálogo, precios, usuarios, pedidos, inventarios…).
// Uso:  npm run respaldo
// Se guarda en la carpeta `respaldos/` del proyecto (no se sube a git: tiene datos personales y contraseñas cifradas).
// Para volver a cargarlo en una base VACÍA:  npm run restaurar -- "respaldos/archivo.json"
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { TABLAS } from "./tablas-respaldo";

const prisma = new PrismaClient();

async function main() {
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/:?]+)/)?.[1] ?? "?";
  console.log(`Respaldando la base ${host}…`);

  const datos: Record<string, unknown[]> = {};
  for (const tabla of TABLAS) {
    const delegado = (prisma as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[tabla];
    datos[tabla] = await delegado.findMany();
    console.log(`  ${tabla.padEnd(20)} ${datos[tabla].length}`);
  }

  // Fecha y hora de Ecuador en el nombre del archivo: respaldo-2026-11-11-0930.json
  const ec = new Date(Date.now() - 5 * 3600_000).toISOString();
  const nombre = `respaldo-${ec.slice(0, 10)}-${ec.slice(11, 13)}${ec.slice(14, 16)}.json`;
  mkdirSync("respaldos", { recursive: true });
  const ruta = join("respaldos", nombre);
  writeFileSync(ruta, JSON.stringify({ version: 1, creado: new Date().toISOString(), base: host, datos }));
  console.log(`\n✔ Respaldo guardado en ${ruta}`);
  console.log("  Copia ese archivo a un lugar seguro (Google Drive, USB…): tiene toda la tienda.");
}

main()
  .catch((e) => {
    console.error("❌ No se pudo respaldar:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
