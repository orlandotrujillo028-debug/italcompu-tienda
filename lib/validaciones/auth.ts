import { z } from "zod";

// Reglas de validación compartidas por los formularios (navegador) y el servidor.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo")
  .pipe(z.email("Correo no válido"));

const password = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Debe tener al menos una letra")
  .regex(/\d/, "Debe tener al menos un número");

const nombre = z.string().trim().min(3, "Ingresa tu nombre completo").max(80, "Nombre demasiado largo");

const telefono = z
  .string()
  .trim()
  .regex(/^(\+?593|0)\d{8,9}$/, "Ej.: 0991234567")
  .or(z.literal(""))
  .optional();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const confirmar = z.string();
const clavesIguales = {
  check: (d: { password: string; confirmar: string }) => d.password === d.confirmar,
  opciones: { message: "Las contraseñas no coinciden", path: ["confirmar"] },
};

export const registroClienteSchema = z
  .object({ nombre, email, telefono, password, confirmar })
  .refine(clavesIguales.check, clavesIguales.opciones);

export const registroVendedorSchema = z
  .object({
    nombre,
    email,
    telefono: z.string().trim().regex(/^(\+?593|0)\d{8,9}$/, "Ej.: 0991234567"),
    nombreTienda: z.string().trim().min(3, "Mínimo 3 caracteres").max(60, "Máximo 60 caracteres"),
    ruc: z
      .string()
      .trim()
      .regex(/^\d{10}001$/, "El RUC tiene 13 dígitos y termina en 001")
      .or(z.literal(""))
      .optional(),
    descripcion: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
    password,
    confirmar,
  })
  .refine(clavesIguales.check, clavesIguales.opciones);

export const recuperarSchema = z.object({ email });

export type LoginInput = z.input<typeof loginSchema>;
export type RegistroClienteInput = z.input<typeof registroClienteSchema>;
export type RegistroVendedorInput = z.input<typeof registroVendedorSchema>;
export type RecuperarInput = z.input<typeof recuperarSchema>;
