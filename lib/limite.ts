import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/*
 * Límite de intentos (contra fuerza bruta y spam de registros).
 * Se guarda en la tabla LimiteIntento con UNA sola instrucción SQL (atómica),
 * así funciona bien aunque lleguen muchos intentos a la vez o haya varios servidores.
 */

export const LIMITES = {
  loginEmail: { max: 5, segundos: 15 * 60 }, // 5 intentos por correo cada 15 min
  loginIp: { max: 30, segundos: 15 * 60 }, // 30 intentos por IP cada 15 min
  registroIp: { max: 5, segundos: 60 * 60 }, // 5 registros por IP por hora
  recuperarIp: { max: 5, segundos: 60 * 60 }, // 5 pedidos de recuperación por IP por hora
} as const;

/** Suma un intento a la clave y dice si ya superó el máximo. */
export async function contarIntento(clave: string, { max, segundos }: { max: number; segundos: number }) {
  const filas = await prisma.$queryRaw<{ conteo: number; expira: Date }[]>`
    INSERT INTO "LimiteIntento" ("clave", "conteo", "expira")
    VALUES (${clave}, 1, NOW() + make_interval(secs => ${segundos}))
    ON CONFLICT ("clave") DO UPDATE SET
      "conteo" = CASE WHEN "LimiteIntento"."expira" < NOW() THEN 1 ELSE "LimiteIntento"."conteo" + 1 END,
      "expira" = CASE WHEN "LimiteIntento"."expira" < NOW() THEN EXCLUDED."expira" ELSE "LimiteIntento"."expira" END
    RETURNING "conteo", "expira"`;

  // De vez en cuando se borran las claves vencidas (para que la tabla no crezca).
  if (Math.random() < 0.02) await prisma.limiteIntento.deleteMany({ where: { expira: { lt: new Date() } } }).catch(() => {});

  const { conteo, expira } = filas[0];
  return {
    bloqueado: Number(conteo) > max,
    minutos: Math.max(1, Math.ceil((new Date(expira).getTime() - Date.now()) / 60_000)),
  };
}

/** Borra el contador (por ejemplo, cuando el login fue correcto). */
export async function reiniciarIntentos(clave: string) {
  await prisma.limiteIntento.deleteMany({ where: { clave } }).catch(() => {});
}

/** IP del visitante (Vercel y la mayoría de proxies la envían en x-forwarded-for). */
export function ipDe(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}

/** IP del visitante dentro de una Server Action. */
export async function ipActual(): Promise<string> {
  return ipDe(await headers());
}
