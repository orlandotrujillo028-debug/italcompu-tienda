import { z } from "zod";
import { PROVINCIAS_ECUADOR, TIPOS_NEGOCIO } from "@/lib/ecuador";

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

const celular = z.string().trim().regex(/^(\+?593|0)\d{8,9}$/, "Ej.: 0991234567");
const telefonoOpcional = celular.or(z.literal("")).optional();

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
  .object({ nombre, email, telefono: telefonoOpcional, password, confirmar })
  .refine(clavesIguales.check, clavesIguales.opciones);

// ---------- Distribuidores ----------

/** Datos del local que pide precios de distribuidor. */
export const datosNegocioSchema = z.object({
  nombreLocal: z.string().trim().min(3, "Mínimo 3 caracteres").max(80, "Máximo 80 caracteres"),
  razonSocial: z.string().trim().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  ruc: z.string().trim().regex(/^\d{10}001$/, "El RUC tiene 13 dígitos y termina en 001"),
  tipoNegocio: z.enum(TIPOS_NEGOCIO, "Elige el tipo de negocio"),
  provincia: z.enum(PROVINCIAS_ECUADOR, "Elige la provincia"),
  ciudad: z.string().trim().min(2, "Ingresa la ciudad").max(60, "Máximo 60 caracteres"),
  direccion: z.string().trim().max(160, "Máximo 160 caracteres").optional(),
  telefonoLocal: celular,
});

/** Registro nuevo: cuenta + datos del local. */
export const registroDistribuidorSchema = z
  .object({ nombre, email, password, confirmar, ...datosNegocioSchema.shape })
  .refine(clavesIguales.check, clavesIguales.opciones);

export const recuperarSchema = z.object({ email });

export type LoginInput = z.input<typeof loginSchema>;
export type RegistroClienteInput = z.input<typeof registroClienteSchema>;
export type DatosNegocioInput = z.input<typeof datosNegocioSchema>;
export type RegistroDistribuidorInput = z.input<typeof registroDistribuidorSchema>;
export type RecuperarInput = z.input<typeof recuperarSchema>;
