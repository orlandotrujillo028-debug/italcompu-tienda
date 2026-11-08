import { z } from "zod";

/** Solo se aceptan imágenes de estos servidores (los mismos permitidos en next.config.ts). */
export const HOSTS_IMAGEN = ["res.cloudinary.com", "placehold.co"];

export function urlImagenPermitida(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOSTS_IMAGEN.includes(u.hostname);
  } catch {
    return false;
  }
}

const numero = (min: number, max: number, msj: string) =>
  z.coerce.number({ error: msj }).refine((n) => Number.isFinite(n) && n >= min && n <= max, msj);

export const productoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, "Solo letras, números y guiones (3 a 30)"),
  nombre: z.string().trim().min(5, "Mínimo 5 caracteres").max(150, "Máximo 150 caracteres"),
  categoryId: z.string().min(1, "Elige la subcategoría"),
  brandId: z.string().optional(),
  precioSinIva: numero(0.01, 100000, "Precio entre $0,01 y $100.000").transform((n) => Math.round(n * 100) / 100),
  stock: numero(0, 100000, "Stock entre 0 y 100.000").pipe(z.number().int("El stock debe ser un número entero")),
  garantiaMeses: numero(0, 60, "Garantía entre 0 y 60 meses").pipe(z.number().int("Meses enteros")),
  descripcion: z.string().trim().max(5000, "Máximo 5.000 caracteres").optional(),
  specs: z
    .array(z.object({ clave: z.string().trim().min(1, "Falta el nombre").max(60), valor: z.string().trim().min(1, "Falta el valor").max(200) }))
    .max(40, "Máximo 40 especificaciones"),
  imagenes: z
    .array(z.string().refine(urlImagenPermitida, "Imagen de un servidor no permitido"))
    .max(10, "Máximo 10 imágenes"),
});

export type ProductoInput = z.input<typeof productoSchema>;
export type ProductoDatos = z.output<typeof productoSchema>;
