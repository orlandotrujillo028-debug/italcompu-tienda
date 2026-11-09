// Crea (o asciende) una cuenta de ADMINISTRADOR en la base configurada en .env (DATABASE_URL).
// Uso:  npm run crear-admin
// Te pide el correo, el nombre y la contraseña (la contraseña no se muestra al escribir).
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// UN solo lector para todas las preguntas (funciona escribiendo en la terminal o con datos por tubería).
const terminal = Boolean(process.stdin.isTTY);
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal });
let ocultar = false;
let preguntaActual = "";
if (terminal) {
  // Mientras se pide una contraseña, lo que escribes se muestra como "*".
  const salida = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  salida._writeToOutput = (s: string) => {
    if (!ocultar || s.includes(preguntaActual)) salida.output.write(s);
    else if (!/[\r\n]/.test(s)) salida.output.write("*".repeat(s.length));
  };
}

// Las líneas se guardan en una cola apenas llegan (con datos por tubería llegan todas de golpe
// y la entrada se cierra antes de que terminemos de consultar la base).
const cola: string[] = [];
let esperando: ((linea: string) => void) | null = null;
rl.on("line", (linea) => {
  if (esperando) {
    const f = esperando;
    esperando = null;
    f(linea);
  } else cola.push(linea);
});
rl.on("close", () => esperando?.("")); // sin más datos: respuesta vacía (fallará la validación)

function preguntar(texto: string, oculto = false): Promise<string> {
  ocultar = oculto;
  preguntaActual = texto;
  process.stdout.write(texto);
  return new Promise((resolve) => {
    const fin = (linea: string) => {
      if (oculto && terminal) process.stdout.write("\n");
      ocultar = false;
      resolve(linea.trim());
    };
    if (cola.length) fin(cola.shift()!);
    else esperando = fin;
  });
}

async function main() {
  console.log("\n=== Crear administrador de ITALCOMPU ===");
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/?]+)/)?.[1] ?? "desconocida";
  console.log(`Base de datos: ${host}\n`);

  const email = (await preguntar("Correo: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo no válido.");

  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, rol: true } });
  const nombre = existente?.name ?? (await preguntar("Nombre completo: "));
  if (nombre.length < 3) throw new Error("Nombre muy corto.");

  const clave = await preguntar("Contraseña (mín. 8, con letras y números): ", true);
  if (clave.length < 8 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) throw new Error("La contraseña debe tener al menos 8 caracteres, letras y números.");
  if ((await preguntar("Repite la contraseña: ", true)) !== clave) throw new Error("Las contraseñas no coinciden.");

  const password = await bcrypt.hash(clave, 12);
  if (existente) {
    await prisma.user.update({ where: { id: existente.id }, data: { rol: "ADMIN", activo: true, password } });
    console.log(`\n✔ ${email} ahora es ADMINISTRADOR (antes: ${existente.rol}). Contraseña actualizada.`);
  } else {
    await prisma.user.create({ data: { email, name: nombre, password, rol: "ADMIN" } });
    console.log(`\n✔ Administrador creado: ${email}`);
  }
  console.log("Entra en /login con ese correo y contraseña.\n");
}

main()
  .catch((e) => {
    console.error(`\n✖ ${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
    return prisma.$disconnect();
  });
