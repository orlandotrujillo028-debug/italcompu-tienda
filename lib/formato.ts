const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

/** 1034.99 → "$1.034,99" */
export function formatoUSD(valor: number | { toString(): string }): string {
  return usd.format(Number(valor));
}

const ZONA_EC = "America/Guayaquil";

/** Fecha en hora de Ecuador (el servidor puede estar en otra zona, p. ej. UTC en Vercel). */
export function fechaEC(fecha: Date, estilo: "corta" | "larga" | "conHora" = "corta"): string {
  const opciones: Intl.DateTimeFormatOptions =
    estilo === "corta"
      ? { day: "numeric", month: "short", year: "numeric" }
      : estilo === "larga"
        ? { day: "numeric", month: "long", year: "numeric" }
        : { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
  return fecha.toLocaleString("es-EC", { ...opciones, timeZone: ZONA_EC });
}
