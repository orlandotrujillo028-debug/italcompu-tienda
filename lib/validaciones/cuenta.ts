import { z } from "zod";

/**
 * Valida cédula ecuatoriana (10 dígitos, algoritmo módulo 10)
 * o RUC (13 dígitos: cédula + 001 para personas, o terminado en 001 para sociedades).
 */
export function cedulaORucValido(valor: string): boolean {
  if (!/^\d{10}(\d{3})?$/.test(valor)) return false;
  const provincia = Number(valor.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;

  const tercero = Number(valor[2]);
  if (valor.length === 13) {
    if (!valor.endsWith("001")) return false;
    if (tercero === 6 || tercero === 9) return true; // RUC de entidad pública o sociedad privada
  }
  if (tercero > 5) return false;

  // Módulo 10 de la cédula (primeros 10 dígitos)
  const suma = valor
    .slice(0, 9)
    .split("")
    .reduce((t, d, i) => {
      let n = Number(d) * (i % 2 === 0 ? 2 : 1);
      if (n > 9) n -= 9;
      return t + n;
    }, 0);
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(valor[9]);
}

export const datosPersonalesSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa tu nombre completo").max(80),
  telefono: z
    .string()
    .trim()
    .regex(/^(\+?593|0)\d{8,9}$/, "Ej.: 0991234567")
    .or(z.literal(""))
    .optional(),
  cedula: z
    .string()
    .trim()
    .refine((v) => v === "" || cedulaORucValido(v), "Cédula o RUC no válido")
    .optional(),
});
export type DatosPersonalesInput = z.input<typeof datosPersonalesSchema>;

export const cambiarClaveSchema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual"),
    nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres")
      .regex(/[A-Za-z]/, "Debe tener al menos una letra")
      .regex(/\d/, "Debe tener al menos un número"),
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, { message: "Las contraseñas no coinciden", path: ["confirmar"] })
  .refine((d) => d.nueva !== d.actual, { message: "La nueva contraseña debe ser distinta de la actual", path: ["nueva"] });
export type CambiarClaveInput = z.input<typeof cambiarClaveSchema>;
