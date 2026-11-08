"use client";

import { firmarSubidaImagen } from "@/app/vendedor/productos/actions";

/**
 * Sube UNA imagen a Cloudinary con firma del servidor y devuelve su enlace https.
 * Lanza un Error con un mensaje en español si algo falla.
 */
export async function subirImagenCloudinary(archivo: File, maxMb = 5): Promise<string> {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (archivo.size > maxMb * 1024 * 1024) throw new Error(`La imagen debe pesar menos de ${maxMb} MB.`);
  const firma = await firmarSubidaImagen();
  if ("error" in firma) throw new Error(firma.error);

  const fd = new FormData();
  fd.append("file", archivo);
  fd.append("api_key", firma.apiKey);
  fd.append("timestamp", String(firma.timestamp));
  fd.append("folder", firma.folder);
  fd.append("signature", firma.signature);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, { method: "POST", body: fd });
  const json = await r.json();
  if (!r.ok || !json.secure_url) throw new Error(json.error?.message ?? "No se pudo subir la imagen.");
  return json.secure_url as string;
}
