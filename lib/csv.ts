// CSV para abrir en Excel en español: separador ";", decimales con coma y BOM UTF-8 (tildes correctas).
import { NextResponse } from "next/server";

/** Evita que Excel interprete textos como fórmulas (=, +, -, @) y escapa comillas. */
export function celdaCsv(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Número con coma decimal (los números no pasan por celdaCsv: un negativo no es una fórmula). */
export const numeroCsv = (v: number | { toString(): string }, decimales = 2) => Number(v).toFixed(decimales).replace(".", ",");

export function respuestaCsv(nombreArchivo: string, encabezado: string[], filas: string[][]) {
  const lineas = [encabezado.map(celdaCsv).join(";"), ...filas.map((f) => f.join(";"))];
  return new NextResponse("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
