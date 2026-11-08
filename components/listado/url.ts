/** Arma "ruta?a=1&b=2" cambiando algunos parámetros (null = quitar). Siempre vuelve a la página 1, salvo que se indique. */
export function conParams(ruta: string, actual: Record<string, string>, cambios: Record<string, string | null>, mantenerPagina = false) {
  const p = new URLSearchParams(actual);
  if (!mantenerPagina) p.delete("page");
  for (const [k, v] of Object.entries(cambios)) {
    if (v === null || v === "") p.delete(k);
    else p.set(k, v);
  }
  const q = p.toString();
  return q ? `${ruta}?${q}` : ruta;
}
