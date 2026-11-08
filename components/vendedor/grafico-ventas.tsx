"use client";

import { useState } from "react";
import { formatoUSD } from "@/lib/formato";
import type { DiaVenta } from "@/lib/ventas";

/**
 * Columnas de ventas por día (una sola serie: el título la nombra, sin leyenda).
 * Barras finas con punta redondeada, separación de 2 px, cuadrícula tenue,
 * detalle al pasar el mouse o con el teclado, y una tabla para lectores de pantalla.
 */
export function GraficoVentas({ dias }: { dias: DiaVenta[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(...dias.map((d) => d.total), 0);
  // Escala "redonda" para el eje: 1, 2, 2.5 o 5 × potencia de 10.
  const tope = (() => {
    if (max <= 0) return 100;
    const p = 10 ** Math.floor(Math.log10(max));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= max) ?? max;
  })();
  const marcas = [0, tope / 2, tope];
  const sinVentas = max === 0;
  const d = activo !== null ? dias[activo] : null;

  return (
    <figure className="space-y-3">
      <div className="relative">
        {/* Detalle del día activo */}
        <div className="mb-2 h-10 text-sm" aria-live="polite">
          {d ? (
            <p>
              <span className="font-semibold text-marca-navy">{d.etiqueta}</span>
              <span className="text-marca-gris"> · {d.pedidos} {d.pedidos === 1 ? "pedido" : "pedidos"}</span>
              <span className="block text-lg font-bold text-foreground">{formatoUSD(d.total)}</span>
            </p>
          ) : (
            <p className="text-marca-gris">{sinVentas ? "Aún no hay ventas en estos días." : "Pasa el mouse sobre una barra para ver el día."}</p>
          )}
        </div>

        <div className="flex h-48 gap-2">
          {/* Eje Y */}
          <div className="flex w-14 flex-col-reverse justify-between text-right text-[11px] text-marca-gris tabular-nums">
            {marcas.map((m) => (
              <span key={m} className="-my-1.5">
                {m >= 1000 ? `$${(m / 1000).toLocaleString("es-EC", { maximumFractionDigits: 1 })}k` : `$${m}`}
              </span>
            ))}
          </div>
          {/* Área del gráfico */}
          <div className="relative flex-1" onMouseLeave={() => setActivo(null)}>
            {marcas.map((m) => (
              <span key={m} aria-hidden className="absolute inset-x-0 border-t border-border/70" style={{ bottom: `${(m / tope) * 100}%` }} />
            ))}
            <div className="relative flex h-full items-end gap-0.5">
              {dias.map((dia, i) => (
                <button
                  key={dia.dia}
                  type="button"
                  aria-label={`${dia.etiqueta}: ${formatoUSD(dia.total)}, ${dia.pedidos} pedidos`}
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  onBlur={() => setActivo(null)}
                  className="group flex h-full flex-1 items-end justify-center outline-none"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t transition-colors ${dia.total > 0 ? "bg-marca-azul" : "bg-transparent"} ${
                      activo === i ? "bg-marca-navy" : ""
                    } group-focus-visible:ring-2 group-focus-visible:ring-marca-cyan`}
                    style={{ height: dia.total > 0 ? `max(2px, ${(dia.total / tope) * 100}%)` : 0 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Eje X: pocas fechas, ubicadas bajo su barra (no chocan en pantallas angostas) */}
        <div className="relative mt-1 ml-16 h-4 text-[11px] text-marca-gris">
          {dias.map((dia, i) =>
            i % 10 === 0 || i === dias.length - 1 ? (
              <span
                key={dia.dia}
                className="absolute whitespace-nowrap"
                style={i === dias.length - 1 ? { right: 0 } : { left: `${((i + 0.5) / dias.length) * 100}%`, transform: i === 0 ? "none" : "translateX(-50%)" }}
              >
                {i === dias.length - 1 ? "Hoy" : dia.etiqueta}
              </span>
            ) : null,
          )}
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-marca-azul hover:underline">Ver como tabla</summary>
        <table className="mt-2 w-full max-w-sm text-sm">
          <thead>
            <tr className="text-left text-marca-gris">
              <th className="py-1 font-medium">Día</th>
              <th className="py-1 text-right font-medium">Pedidos</th>
              <th className="py-1 text-right font-medium">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {dias
              .filter((x) => x.pedidos > 0)
              .map((x) => (
                <tr key={x.dia} className="border-t">
                  <td className="py-1">{x.etiqueta}</td>
                  <td className="py-1 text-right tabular-nums">{x.pedidos}</td>
                  <td className="py-1 text-right tabular-nums">{formatoUSD(x.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
