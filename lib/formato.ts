const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

/** 1034.99 → "$1.034,99" */
export function formatoUSD(valor: number | { toString(): string }): string {
  return usd.format(Number(valor));
}
