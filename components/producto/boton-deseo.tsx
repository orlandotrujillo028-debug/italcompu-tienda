"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { alternarDeseo } from "@/app/(tienda)/actions";

/** Corazón de lista de deseos. Sin sesión, lleva al login y vuelve a la misma página. */
export function BotonDeseo({ productId, inicial, className = "" }: { productId: string; inicial: boolean; className?: string }) {
  const [enLista, setEnLista] = useState(inicial);
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();
  const ruta = usePathname();

  const alternar = () =>
    startTransition(async () => {
      const anterior = enLista;
      setEnLista(!anterior); // respuesta inmediata en pantalla
      const r = await alternarDeseo(productId);
      if ("necesitaLogin" in r) {
        setEnLista(anterior);
        toast.info("Inicia sesión para guardar productos en tu lista de deseos.");
        router.push(`/login?callbackUrl=${encodeURIComponent(ruta)}`);
      } else if ("error" in r) {
        setEnLista(anterior);
        toast.error(r.error);
      } else {
        setEnLista(r.enLista);
        toast.success(r.enLista ? "Guardado en tu lista de deseos" : "Quitado de tu lista de deseos");
        if (ruta.startsWith("/cuenta/deseos")) router.refresh(); // en la lista, la tarjeta desaparece al quitarla
      }
    });

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendiente}
      aria-pressed={enLista}
      aria-label={enLista ? "Quitar de la lista de deseos" : "Agregar a la lista de deseos"}
      className={`flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 disabled:opacity-60 ${className}`}
    >
      <Heart className={`size-4.5 ${enLista ? "fill-rose-500 text-rose-500" : "text-marca-gris"}`} />
    </button>
  );
}
