import { z } from "zod";

const porcentaje = (max: number, msj: string) => z.coerce.number({ error: msj }).min(0, msj).max(max, msj);
const dinero = z.coerce.number({ error: "Monto no válido" }).min(0, "Monto no válido").max(100000, "Monto no válido");
const urlRed = z
  .string()
  .trim()
  .max(200)
  .refine((u) => u === "" || /^https:\/\/[^\s]+$/.test(u), "Debe empezar con https://");

/** Todo lo que el admin puede configurar (tabla Setting, clave → valor). */
export const configuracionSchema = z.object({
  iva: porcentaje(50, "IVA entre 0 y 50 %"),
  // Utilidad sobre el COSTO del inventario (precio sin IVA = costo × (1 + utilidad)).
  utilidad_publico: porcentaje(500, "Utilidad entre 0 y 500 %"),
  utilidad_distribuidor: porcentaje(500, "Utilidad entre 0 y 500 %"),
  costo_envio: dinero,
  envio_gratis_desde: dinero,
  whatsapp: z.string().trim().regex(/^593\d{9}$/, "Formato 593 + 9 dígitos, ej. 593991234567"),
  // Número que RECIBE los pedidos desde el checkout. Vacío = se usa el WhatsApp general.
  whatsapp_pedidos: z
    .string()
    .trim()
    .regex(/^(593\d{9})?$/, "Formato 593 + 9 dígitos, o déjalo vacío para usar el WhatsApp general"),
  telefono: z.string().trim().max(30),
  email_contacto: z.string().trim().pipe(z.email("Correo no válido")),
  direccion_matriz: z.string().trim().max(160),
  horario: z.string().trim().max(120),
  facebook: urlRed,
  instagram: urlRed,
  tiktok: urlRed,
  datos_bancarios: z.string().trim().max(800),
}).refine((d) => d.utilidad_distribuidor <= d.utilidad_publico, {
  path: ["utilidad_distribuidor"],
  message: "La utilidad del distribuidor no puede ser mayor que la del público",
});

export type ConfiguracionInput = z.input<typeof configuracionSchema>;
export const CLAVES_CONFIG = Object.keys(configuracionSchema.shape) as (keyof ConfiguracionInput)[];
