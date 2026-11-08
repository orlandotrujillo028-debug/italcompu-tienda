import { z } from "zod";
import { PROVINCIAS_ECUADOR } from "@/lib/ecuador";

/** Lo que el navegador manda del carrito: solo ids y cantidades (nunca precios). */
export const itemsCarritoSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(40),
      cantidad: z.number().int().min(1).max(99),
    }),
  )
  .max(50, "El carrito tiene demasiados productos.");

export const METODOS_ENVIO = ["DOMICILIO", "RETIRO"] as const;
export type MetodoEnvio = (typeof METODOS_ENVIO)[number];

export const METODOS_PAGO = ["TARJETA", "TRANSFERENCIA", "CONTRA_ENTREGA"] as const;

export const direccionSchema = z.object({
  nombre: z.string().trim().min(3, "¿Quién recibe el pedido?").max(80),
  telefono: z.string().trim().regex(/^(\+?593|0)\d{8,9}$/, "Ej.: 0991234567"),
  provincia: z.enum(PROVINCIAS_ECUADOR, "Elige la provincia"),
  ciudad: z.string().trim().min(2, "Ingresa la ciudad").max(60),
  direccion: z.string().trim().min(8, "Escribe calle principal, número y calle secundaria").max(160),
  referencia: z.string().trim().max(160).optional(),
  principal: z.boolean().optional(),
});
export type DireccionInput = z.input<typeof direccionSchema>;

export const checkoutSchema = z
  .object({
    items: itemsCarritoSchema.min(1, "Tu carrito está vacío."),
    metodoEnvio: z.enum(METODOS_ENVIO),
    direccionId: z.string().max(40).optional(),
    metodoPago: z.enum(METODOS_PAGO, "Elige cómo vas a pagar"),
    notas: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.metodoEnvio === "RETIRO" || !!d.direccionId, {
    message: "Elige la dirección de entrega.",
    path: ["direccionId"],
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;
