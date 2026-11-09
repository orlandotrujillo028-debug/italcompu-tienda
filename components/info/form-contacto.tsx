"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { IconoMarca } from "@/components/tienda/iconos";

const MOTIVOS = ["Consulta sobre un producto", "Estado de mi pedido", "Garantía o servicio técnico", "Cotización para empresa", "Otro"];

/**
 * Formulario de contacto que arma el mensaje y lo abre en WhatsApp.
 * No guarda nada ni necesita servidor de correo: el cliente envía el mensaje desde su WhatsApp.
 */
export function FormContacto({ whatsapp }: { whatsapp: string }) {
  const [d, setD] = useState({ nombre: "", motivo: MOTIVOS[0], mensaje: "" });
  const [error, setError] = useState<string>();

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (d.nombre.trim().length < 2) return setError("Escribe tu nombre.");
    if (d.mensaje.trim().length < 5) return setError("Cuéntanos en qué te ayudamos.");
    setError(undefined);
    const texto = `Hola ITALCOMPU, soy ${d.nombre.trim()}.\n*${d.motivo}*\n${d.mensaje.trim()}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  };

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="c-nombre" label="Tu nombre" autoComplete="name" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        <div className="space-y-1.5">
          <Label htmlFor="c-motivo">Motivo</Label>
          <select id="c-motivo" value={d.motivo} onChange={(e) => setD({ ...d, motivo: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring">
            {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-mensaje">Mensaje</Label>
        <textarea id="c-mensaje" rows={4} maxLength={800} value={d.mensaje} onChange={(e) => setD({ ...d, mensaje: e.target.value })} placeholder="Ej.: ¿Tienen la laptop X en stock para retirar hoy?" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring" />
      </div>
      <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0f7a6e] px-5 font-semibold text-white hover:bg-[#075e54]">
        <IconoMarca marca="whatsapp" className="size-5" /> Enviar por WhatsApp
      </button>
    </form>
  );
}
