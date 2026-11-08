import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Datos de contacto y redes de la tienda (tabla Setting, editables desde el admin en el Paso 11). */
export const getConfigTienda = cache(async () => {
  const filas = await prisma.setting.findMany();
  const v = (clave: string) => filas.find((f) => f.clave === clave)?.valor?.trim() || "";

  const whatsapp = v("whatsapp").replace(/\D/g, ""); // solo dígitos, ej. 593990000000
  return {
    whatsapp,
    whatsappUrl: whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola ITALCOMPU, quisiera información sobre un producto.")}`
      : "",
    email: v("email_contacto"),
    telefono: v("telefono"),
    direccion: v("direccion_matriz"),
    horario: v("horario"),
    redes: {
      facebook: v("facebook"),
      instagram: v("instagram"),
      tiktok: v("tiktok"),
    },
  };
});

export type ConfigTienda = Awaited<ReturnType<typeof getConfigTienda>>;
