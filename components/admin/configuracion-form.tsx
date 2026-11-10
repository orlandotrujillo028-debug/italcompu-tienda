"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Campo } from "@/components/auth/campo";
import { guardarConfiguracion } from "@/app/admin/configuracion/actions";
import { formatoUSD } from "@/lib/formato";
import { calcularPrecio, descuentoPorUtilidades, precioDesdeCosto } from "@/lib/precios-calculo";
import { configuracionSchema, type ConfiguracionInput } from "@/lib/validaciones/configuracion";

export function ConfiguracionForm({ valores }: { valores: ConfiguracionInput }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const { register, handleSubmit, formState, watch, reset } = useForm<ConfiguracionInput>({ resolver: zodResolver(configuracionSchema), defaultValues: valores });
  const e = formState.errors;

  // Ejemplo en vivo: cómo queda un producto que costó $100 sin IVA.
  const iva = Number(watch("iva")) || 0;
  const up = Number(watch("utilidad_publico")) || 0;
  const ud = Number(watch("utilidad_distribuidor")) || 0;
  const base = precioDesdeCosto(100, up);
  const ejemplo = {
    publico: calcularPrecio(base, { iva, esDistribuidor: false, descuento: 0 }).conIva,
    distribuidor: calcularPrecio(base, { iva, esDistribuidor: true, descuento: descuentoPorUtilidades(up, ud) }).conIva,
  };
  const cambiaIva = Number(watch("iva")) !== Number(valores.iva);
  const cambiaUtilidad = up !== Number(valores.utilidad_publico);

  const enviar = handleSubmit((datos) =>
    startTransition(async () => {
      const r = await guardarConfiguracion(datos);
      if ("error" in r) return void toast.error(r.error);
      toast.success("Configuración guardada");
      reset(datos);
      router.refresh();
    }),
  );

  const seccion = "space-y-4 rounded-xl border bg-card p-5";
  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <section className={seccion}>
        <h2 className="font-bold text-marca-navy">Precios</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="iva" label="IVA (%)" inputMode="decimal" error={e.iva?.message} {...register("iva")} />
          <Campo
            id="utilidad_publico"
            label="Utilidad venta al público (%)"
            inputMode="decimal"
            ayuda="Se suma al costo del inventario."
            error={e.utilidad_publico?.message}
            {...register("utilidad_publico")}
          />
          <Campo
            id="utilidad_distribuidor"
            label="Utilidad venta a distribuidor (%)"
            inputMode="decimal"
            ayuda="También sobre el costo."
            error={e.utilidad_distribuidor?.message}
            {...register("utilidad_distribuidor")}
          />
        </div>
        <p className="rounded-lg bg-marca-fondo p-3 text-sm">
          Ejemplo: un producto que costó $100 (sin IVA) se verá a <strong className="text-marca-azul">{formatoUSD(ejemplo.publico)}</strong> para el público y a{" "}
          <strong className="text-marca-navy">{formatoUSD(ejemplo.distribuidor)}</strong> para distribuidores (precios con IVA).
        </p>
        {cambiaUtilidad && (
          <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Al guardar se recalcula el precio de todos los productos del inventario con la nueva utilidad. Los pedidos ya hechos no cambian.
          </p>
        )}
        {cambiaIva && (
          <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Cambiar el IVA modifica al instante el precio de TODO el catálogo. Los pedidos ya hechos no cambian.
          </p>
        )}
      </section>

      <section className={seccion}>
        <h2 className="font-bold text-marca-navy">Envíos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="costo_envio" label="Costo de envío a domicilio (USD)" inputMode="decimal" error={e.costo_envio?.message} {...register("costo_envio")} />
          <Campo id="envio_gratis_desde" label="Envío gratis desde (USD, con IVA)" inputMode="decimal" error={e.envio_gratis_desde?.message} {...register("envio_gratis_desde")} />
        </div>
      </section>

      <section className={seccion}>
        <h2 className="font-bold text-marca-navy">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="whatsapp" label="WhatsApp de atención (botón flotante)" placeholder="593991234567" error={e.whatsapp?.message} {...register("whatsapp")} />
          <Campo
            id="whatsapp_pedidos"
            label="WhatsApp que recibe los PEDIDOS"
            placeholder="Vacío = el mismo de atención"
            ayuda="Al confirmar una compra, el pedido se envía a este número."
            error={e.whatsapp_pedidos?.message}
            {...register("whatsapp_pedidos")}
          />
          <Campo id="telefono" label="Teléfono fijo" error={e.telefono?.message} {...register("telefono")} />
          <Campo id="email_contacto" label="Correo de contacto" type="email" error={e.email_contacto?.message} {...register("email_contacto")} />
          <Campo id="horario" label="Horario de atención" error={e.horario?.message} {...register("horario")} />
        </div>
        <Campo id="direccion_matriz" label="Dirección de la matriz (también es el punto de retiro)" error={e.direccion_matriz?.message} {...register("direccion_matriz")} />
      </section>

      <section className={seccion}>
        <h2 className="font-bold text-marca-navy">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="facebook" label="Facebook" placeholder="https://facebook.com/…" error={e.facebook?.message} {...register("facebook")} />
          <Campo id="instagram" label="Instagram" placeholder="https://instagram.com/…" error={e.instagram?.message} {...register("instagram")} />
          <Campo id="tiktok" label="TikTok" placeholder="https://tiktok.com/@…" error={e.tiktok?.message} {...register("tiktok")} />
        </div>
        <p className="text-xs text-marca-gris">Deja vacío el campo de una red que no uses y su icono desaparece de la tienda.</p>
      </section>

      <section className={seccion}>
        <h2 className="font-bold text-marca-navy">Datos bancarios (para transferencias)</h2>
        <div className="space-y-1.5">
          <Label htmlFor="datos_bancarios">Se muestran al cliente que elige pagar por transferencia</Label>
          <textarea id="datos_bancarios" rows={4} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring" {...register("datos_bancarios")} />
          {e.datos_bancarios && <p className="text-sm text-destructive">{e.datos_bancarios.message}</p>}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t bg-marca-fondo/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Button type="submit" disabled={pendiente || !formState.isDirty}>
          {pendiente ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios
        </Button>
      </div>
    </form>
  );
}
