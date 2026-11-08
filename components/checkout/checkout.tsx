"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, HandCoins, Loader2, MapPin, Plus, Store, Truck } from "lucide-react";
import { IconoMarca } from "@/components/tienda/iconos";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Resumen } from "@/components/carrito/resumen";
import { useCotizacion } from "@/components/carrito/use-cotizacion";
import { DireccionForm } from "@/components/checkout/direccion-form";
import { crearPedido } from "@/app/(tienda)/checkout/actions";
import { useCarrito } from "@/lib/carrito-store";
import { formatoUSD } from "@/lib/formato";
import type { MetodoEnvio } from "@/lib/validaciones/pedido";

type Direccion = { id: string; nombre: string; telefono: string; provincia: string; ciudad: string; direccion: string; referencia: string | null; principal: boolean };
type MetodoPago = "TARJETA" | "TRANSFERENCIA" | "CONTRA_ENTREGA";

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-labelledby={`paso-${n}`}>
      <h2 id={`paso-${n}`} className="flex items-center gap-3 text-lg font-bold text-marca-navy">
        <span className="flex size-7 items-center justify-center rounded-full bg-marca-azul text-sm text-white">{n}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Tarjeta seleccionable (radio con apariencia de tarjeta). */
function Opcion({ nombre, valor, actual, alElegir, children }: { nombre: string; valor: string; actual: string; alElegir: (v: string) => void; children: React.ReactNode }) {
  const activa = valor === actual;
  return (
    <label className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition ${activa ? "border-marca-azul bg-accent/60" : "border-border bg-white hover:border-marca-cyan"}`}>
      <input type="radio" name={nombre} value={valor} checked={activa} onChange={() => alElegir(valor)} className="mt-1 size-4 accent-marca-azul" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

export function Checkout({ direcciones, nombreUsuario, tienda }: { direcciones: Direccion[]; nombreUsuario: string; tienda: { direccion: string; horario: string } }) {
  const router = useRouter();
  const [metodoEnvio, setMetodoEnvio] = useState<MetodoEnvio>("DOMICILIO");
  const { items, cotizacion: c, cargando } = useCotizacion(metodoEnvio);
  const vaciar = useCarrito((s) => s.vaciar);

  const [direccionId, setDireccionId] = useState(direcciones.find((d) => d.principal)?.id ?? direcciones[0]?.id ?? "");
  const [nuevaDireccion, setNuevaDireccion] = useState(direcciones.length === 0);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string>();
  const [enviando, startTransition] = useTransition();
  const [creado, setCreado] = useState<number | null>(null);

  if (creado) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-card py-20 font-medium text-marca-navy">
        <Loader2 className="size-5 animate-spin text-marca-azul" /> Pedido #{creado} creado. Abriendo WhatsApp y el resumen…
      </div>
    );
  }

  if (cargando && !c) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-card py-20 text-marca-gris">
        <Loader2 className="size-5 animate-spin" /> Preparando tu pedido…
      </div>
    );
  }

  if (items.length === 0 || !c || c.lineas.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-6 py-16 text-center">
        <p className="text-lg font-semibold text-marca-navy">Tu carrito está vacío</p>
        <Button asChild className="mt-4">
          <Link href="/">Ir a la tienda</Link>
        </Button>
      </div>
    );
  }

  const retiro = metodoEnvio === "RETIRO";

  const confirmar = () => {
    setError(undefined);
    if (!retiro && !direccionId) return setError("Elige o agrega una dirección de entrega.");
    if (!metodoPago) return setError("Elige cómo vas a pagar.");
    // Abrimos la pestaña de WhatsApp YA (en el mismo clic), porque los navegadores bloquean
    // ventanas que se abren después de esperar al servidor. Luego le ponemos la dirección.
    const ventana = window.open("about:blank", "_blank");
    startTransition(async () => {
      const r = await crearPedido({ items, metodoEnvio, direccionId: retiro ? undefined : direccionId, metodoPago, notas });
      if ("numero" in r) {
        setCreado(r.numero);
        vaciar();
        if (r.whatsapp && ventana) {
          ventana.location.href = r.whatsapp;
          toast.success(`¡Pedido #${r.numero} creado! Envía el mensaje en WhatsApp para confirmarlo.`);
        } else {
          ventana?.close();
          toast.success(`¡Pedido #${r.numero} creado!`);
        }
        router.push(`/pedido/${r.numero}/confirmacion`);
      } else {
        ventana?.close();
        setError(r.error);
        if (r.avisos?.length) router.push("/carrito");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-4">
        <Paso n={1} titulo="¿Cómo recibes tu pedido?">
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion nombre="envio" valor="DOMICILIO" actual={metodoEnvio} alElegir={(v) => setMetodoEnvio(v as MetodoEnvio)}>
              <span className="flex items-center gap-2 font-semibold text-marca-navy"><Truck className="size-4 text-marca-azul" /> Envío a domicilio</span>
              <span className="block text-xs text-marca-gris">Servientrega a todo Ecuador</span>
            </Opcion>
            <Opcion nombre="envio" valor="RETIRO" actual={metodoEnvio} alElegir={(v) => setMetodoEnvio(v as MetodoEnvio)}>
              <span className="flex items-center gap-2 font-semibold text-marca-navy"><Store className="size-4 text-marca-azul" /> Retiro en tienda</span>
              <span className="block text-xs text-marca-gris">Gratis · {tienda.direccion || "Matriz ITALCOMPU"}</span>
            </Opcion>
          </div>
        </Paso>

        {!retiro && (
          <Paso n={2} titulo="Dirección de entrega">
            {direcciones.length > 0 && (
              <div className="grid gap-3">
                {direcciones.map((d) => (
                  <Opcion key={d.id} nombre="direccion" valor={d.id} actual={direccionId} alElegir={(v) => { setDireccionId(v); setError(undefined); }}>
                    <span className="flex items-center gap-2 font-semibold text-marca-navy">
                      <MapPin className="size-4 text-marca-azul" /> {d.nombre}
                      {d.principal && <span className="rounded bg-marca-cyan/15 px-1.5 text-[11px] font-medium">Principal</span>}
                    </span>
                    <span className="block text-sm">{d.direccion}</span>
                    <span className="block text-xs text-marca-gris">
                      {d.ciudad}, {d.provincia} · {d.telefono}
                      {d.referencia && ` · ${d.referencia}`}
                    </span>
                  </Opcion>
                ))}
              </div>
            )}
            {nuevaDireccion ? (
              <DireccionForm
                nombreInicial={nombreUsuario}
                alCancelar={direcciones.length ? () => setNuevaDireccion(false) : undefined}
                alGuardar={(id) => {
                  setDireccionId(id);
                  setNuevaDireccion(false);
                  toast.success("Dirección guardada");
                  router.refresh(); // vuelve a cargar la lista desde el servidor
                }}
              />
            ) : (
              <Button type="button" variant="outline" onClick={() => setNuevaDireccion(true)}>
                <Plus /> Agregar otra dirección
              </Button>
            )}
          </Paso>
        )}

        <Paso n={retiro ? 2 : 3} titulo="Forma de pago">
          <div className="grid gap-3">
            <Opcion nombre="pago" valor="TARJETA" actual={metodoPago} alElegir={(v) => { setMetodoPago(v as MetodoPago); setError(undefined); }}>
              <span className="flex items-center gap-2 font-semibold text-marca-navy"><CreditCard className="size-4 text-marca-azul" /> Tarjeta de crédito o débito</span>
              <span className="block text-xs text-marca-gris">Te enviamos un link de pago seguro por WhatsApp.</span>
            </Opcion>
            <Opcion nombre="pago" valor="TRANSFERENCIA" actual={metodoPago} alElegir={(v) => { setMetodoPago(v as MetodoPago); setError(undefined); }}>
              <span className="flex items-center gap-2 font-semibold text-marca-navy"><Banknote className="size-4 text-marca-azul" /> Transferencia o depósito</span>
              <span className="block text-xs text-marca-gris">Te mostramos los datos bancarios al confirmar. Despachamos al validar el pago.</span>
            </Opcion>
            <Opcion nombre="pago" valor="CONTRA_ENTREGA" actual={metodoPago} alElegir={(v) => { setMetodoPago(v as MetodoPago); setError(undefined); }}>
              <span className="flex items-center gap-2 font-semibold text-marca-navy"><HandCoins className="size-4 text-marca-azul" /> {retiro ? "Pago al retirar" : "Pago contra entrega"}</span>
              <span className="block text-xs text-marca-gris">{retiro ? "Pagas en la tienda cuando retiras." : "Pagas en efectivo al recibir tu pedido."}</span>
            </Opcion>
          </div>
        </Paso>

        <Paso n={retiro ? 3 : 4} titulo="Revisa y confirma">
          <ul className="divide-y rounded-lg border">
            {c.lineas.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 p-2.5">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md border bg-white">
                  {l.imagen && <Image src={l.imagen} alt="" fill sizes="48px" className="object-contain p-1" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium">{l.nombre}</span>
                  <span className="text-xs text-marca-gris">
                    {l.cantidad} × {formatoUSD(l.unitarioConIva)}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatoUSD(l.totalLinea)}</span>
              </li>
            ))}
          </ul>
          <Link href="/carrito" className="inline-block text-sm font-medium text-marca-azul hover:underline">
            Modificar carrito
          </Link>
          <div className="space-y-1.5">
            <label htmlFor="notas" className="text-sm font-medium text-marca-navy">Notas para el pedido (opcional)</label>
            <textarea
              id="notas"
              rows={2}
              maxLength={300}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej.: entregar en horario de oficina"
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring"
            />
          </div>
        </Paso>
      </div>

      <div className="lg:sticky lg:top-40">
        <Resumen c={c} retiro={retiro}>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button size="lg" className="h-12 w-full text-base" onClick={confirmar} disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <IconoMarca marca="whatsapp" className="size-5" />}
            Enviar pedido por WhatsApp · {formatoUSD(c.total)}
          </Button>
          <p className="text-center text-xs text-marca-gris">
            Al confirmar aceptas los{" "}
            <Link href="/terminos" className="underline">términos y condiciones</Link>.
          </p>
        </Resumen>
      </div>
    </div>
  );
}
