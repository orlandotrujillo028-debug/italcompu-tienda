"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pantalla de error amigable (se usa en los error.tsx).
 * No muestra detalles técnicos al cliente; el código de referencia ayuda a buscar el error en los registros.
 */
export function ErrorPagina({ error, reset, inicio = "/" }: { error: Error & { digest?: string }; reset: () => void; inicio?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-marca-navy">Algo salió mal</h1>
      <p className="text-marca-gris">Tuvimos un problema al cargar esta página. Intenta de nuevo; si sigue pasando, escríbenos por WhatsApp.</p>
      {error.digest && <p className="text-xs text-marca-gris">Código de referencia: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={reset}><RotateCcw /> Reintentar</Button>
        <Button asChild variant="outline"><Link href={inicio}>Ir al inicio</Link></Button>
      </div>
    </main>
  );
}
