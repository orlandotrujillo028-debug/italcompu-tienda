"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { simularPagoTarjeta } from "@/app/(tienda)/pedido/[numero]/confirmacion/actions";

/** Botón solo para desarrollo: simula que la pasarela aprobó el pago. */
export function SimularPago({ numero }: { numero: number }) {
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
        <FlaskConical className="size-3.5" /> Modo pruebas: la pasarela de pago real se conecta en el Paso 12.
      </p>
      <Button
        size="sm"
        disabled={pendiente}
        onClick={() =>
          startTransition(async () => {
            const r = await simularPagoTarjeta(numero);
            if (r.ok) {
              toast.success("Pago simulado aprobado");
              router.refresh();
            } else toast.error(r.error ?? "No se pudo simular el pago");
          })
        }
      >
        {pendiente && <Loader2 className="animate-spin" />}
        Simular pago aprobado
      </Button>
    </div>
  );
}
