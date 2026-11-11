// RESTAURA un respaldo de `npm run respaldo` en una base de datos VACÍA (recién creada y con las
// migraciones aplicadas: `npm run db:deploy`). Si la base ya tiene productos o usuarios, NO hace nada.
// Uso:  npm run restaurar -- "respaldos/respaldo-2026-11-11-0930.json"
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";
import { TABLAS } from "./tablas-respaldo";

const prisma = new PrismaClient({ transactionOptions: { maxWait: 20_000, timeout: 300_000 } });

type Fila = Record<string, unknown>;
type Delegado = { createMany: (a: { data: Fila[] }) => Promise<unknown>; count: () => Promise<number> };

async function main() {
  const ruta = process.argv[2];
  if (!ruta) throw new Error('Indica el archivo: npm run restaurar -- "respaldos/respaldo-....json"');
  const respaldo = JSON.parse(readFileSync(ruta, "utf8")) as { version: number; creado: string; base: string; datos: Record<string, Fila[]> };
  if (respaldo.version !== 1 || !respaldo.datos) throw new Error("El archivo no es un respaldo de la tienda.");

  const host = (process.env.DATABASE_URL ?? "").match(/@([^/:?]+)/)?.[1] ?? "?";
  const [productos, usuarios] = await Promise.all([prisma.product.count(), prisma.user.count()]);
  if (productos > 0 || usuarios > 0) {
    console.log(`❌ La base ${host} NO está vacía (${productos} productos, ${usuarios} usuarios). No se restauró nada.`);
    console.log("   Restaurar solo funciona en una base nueva, para no mezclar ni pisar datos.");
    return;
  }

  console.log(`Respaldo del ${respaldo.creado} (base ${respaldo.base}) → base ${host}`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ok = (await rl.question("Escribe RESTAURAR para continuar: ")).trim();
  rl.close();
  if (ok !== "RESTAURAR") return console.log("Cancelado. No se cambió nada.");

  await prisma.$transaction(async (tx) => {
    for (const tabla of TABLAS) {
      let filas = respaldo.datos[tabla] ?? [];
      // Categorías: primero las principales (las subcategorías apuntan a su categoría padre).
      if (tabla === "category") filas = [...filas].sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null));
      const delegado = (tx as unknown as Record<string, Delegado>)[tabla];
      for (let k = 0; k < filas.length; k += 500) await delegado.createMany({ data: filas.slice(k, k + 500) });
      console.log(`  ${tabla.padEnd(20)} ${filas.length}`);
    }
    // El número de pedido (#1001…) sigue desde el último restaurado.
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Order"', 'numero'), GREATEST((SELECT COALESCE(MAX("numero"), 1000) FROM "Order"), 1000))`,
    );
  });
  console.log("\n✔ Respaldo restaurado.");
}

main()
  .catch((e) => {
    console.error("❌ No se pudo restaurar (no se guardó nada):", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
