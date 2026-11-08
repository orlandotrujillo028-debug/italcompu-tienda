"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUsuarioActual } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

type ResultadoDeseo = { enLista: boolean } | { necesitaLogin: true } | { error: string };

/** Agrega o quita un producto de la lista de deseos del usuario con sesión. */
export async function alternarDeseo(productId: unknown): Promise<ResultadoDeseo> {
  const id = z.string().min(1).max(40).safeParse(productId);
  if (!id.success) return { error: "Producto no válido." };

  const usuario = await getUsuarioActual();
  if (!usuario) return { necesitaLogin: true };

  const clave = { userId_productId: { userId: usuario.id, productId: id.data } };
  const existe = await prisma.wishlistItem.findUnique({ where: clave, select: { productId: true } });

  if (existe) {
    await prisma.wishlistItem.delete({ where: clave });
  } else {
    const producto = await prisma.product.findFirst({ where: { id: id.data, estado: "PUBLICADO" }, select: { id: true } });
    if (!producto) return { error: "Este producto ya no está disponible." };
    await prisma.wishlistItem.create({ data: { userId: usuario.id, productId: id.data } });
  }

  revalidatePath("/cuenta", "layout");
  return { enLista: !existe };
}
