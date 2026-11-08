"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PackageOpen, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actualizarGuia, cambiarEstadoPedido } from "@/app/vendedor/pedidos/actions";
import type { EstadoPedido } from "@/lib/pedidos-ui";

const BOTON: Record<string, { texto: string; Icono: typeof Truck }> = {
  PREPARANDO: { texto: "Empezar a preparar", Icono: PackageOpen },
  ENVIADO: { texto: "Marcar como enviado", Icono: Truck },
  ENTREGADO: { texto: "Marcar como entregado", Icono: CheckCircle2 },
};

/** Acciones del personal sobre un pedido: avanzar estado y registrar la guía. */
export function GestionPedido({ numero, siguientes, guiaActual, estado }: { numero: number; siguientes: EstadoPedido[]; guiaActual: string | null; estado: EstadoPedido }) {
  const router = useRouter();
  const [guia, setGuia] = useState(guiaActual ?? "");
  const [pendiente, startTransition] = useTransition();
  const pideGuia = siguientes.includes("ENVIADO") || estado === "ENVIADO";

  const avanzar = (nuevo: EstadoPedido) =>
    startTransition(async () => {
      const r = await cambiarEstadoPedido({ numero, estado: nuevo, guia: guia.trim() || undefined });
      if ("error" in r) return void toast.error(r.error);
      toast.success(`Pedido #${numero} actualizado`);
      router.refresh();
    });

  const guardarGuia = () =>
    startTransition(async () => {
      const r = await actualizarGuia(numero, guia);
      if ("error" in r) return void toast.error(r.error);
      toast.success("Guía actualizada");
      router.refresh();
    });

  if (siguientes.length === 0 && estado !== "ENVIADO") {
    return (
      <p className="text-sm text-marca-gris">
        {estado === "PENDIENTE_PAGO"
          ? "Esperando el pago del cliente. El administrador confirma las transferencias."
          : "Este pedido ya no requiere acciones del equipo de ventas."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pideGuia && (
        <div className="space-y-1.5">
          <label htmlFor="guia" className="text-sm font-medium">Número de guía (Servientrega)</label>
          <div className="flex gap-2">
            <input
              id="guia"
              value={guia}
              onChange={(e) => setGuia(e.target.value.toUpperCase())}
              placeholder="Ej.: 1234567890"
              maxLength={40}
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-ring"
            />
            {estado === "ENVIADO" && (
              <Button variant="outline" size="sm" className="h-9" disabled={pendiente || !guia.trim() || guia === guiaActual} onClick={guardarGuia}>
                Guardar guía
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {siguientes.map((s) => {
          const { texto, Icono } = BOTON[s];
          return (
            <Button key={s} disabled={pendiente} onClick={() => avanzar(s)}>
              {pendiente ? <Loader2 className="animate-spin" /> : <Icono />}
              {texto}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
