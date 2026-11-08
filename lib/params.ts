/** Convierte los searchParams de Next en un objeto simple { clave: "valor" } (toma el primero si se repite). */
export function aConsulta(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const valor = Array.isArray(v) ? v[0] : v;
    if (valor !== undefined && valor !== "") out[k] = valor.slice(0, 200);
  }
  return out;
}
