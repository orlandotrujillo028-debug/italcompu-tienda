import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { LOGO } from "./logo-datos";

type Trazo = keyof Omit<typeof LOGO, "hueco" | "marca" | "lema">;

// Cada trazo: color (id de degradado o color plano) y cuándo empieza a dibujarse (segundos).
const TRAZOS: { k: Trazo; color: string; d: number }[] = [
  { k: "grande", color: "grande", d: 0.25 },
  { k: "exterior", color: "exterior", d: 0.45 },
  { k: "azulArriba", color: "azul", d: 0.35 },
  { k: "grisArriba", color: "gris", d: 0.5 },
  { k: "grisIzq", color: "gris", d: 0.6 },
  { k: "cyanIzq", color: "#12b4e6", d: 0.55 },
  { k: "grisDer", color: "gris", d: 0.7 },
];

// Nodos del circuito (centro, radio, color, retraso de aparición).
const NODOS = [
  { x: 1183, y: 145, r: 52, c: "#12b4e6", d: 0.3 },
  { x: 1317, y: 272, r: 33, c: "azul", d: 0.5 },
  { x: 1240, y: 325, r: 32, c: "gris", d: 0.75 },
  { x: 227, y: 688, r: 48, c: "#12b4e6", d: 0.6 },
  { x: 170, y: 540, r: 30, c: "gris", d: 0.65 },
];

// Colores por tono: "normal" para fondos claros; "claro" para fondos oscuros (sin recuadro blanco).
const PALETAS = {
  normal: {
    monitor: ["#0b7fc6", "#0a62aa", "#0b3a82"],
    grande: ["#12b4e6", "#0a7cc6", "#0a46a0", "#0b2f8a"],
    exterior: ["#0a6db3", "#0b3f86"],
    azul: ["#0a6db3", "#0b2f8a"],
    gris: ["#9a9a9a", "#6e6e6e"],
    texto: ["#0a78c0", "#0b4f98"],
    lema: "#6b6b6b",
    nodoGris: "#8c8c8c",
    nodoAzul: "#0a6db3",
  },
  claro: {
    monitor: ["#4cc0f2", "#1e8fdc", "#1565c8"],
    grande: ["#7fdcf7", "#2fb8ee", "#1d8fe0", "#2f6fe0"],
    exterior: ["#38a8ec", "#3b78e6"],
    azul: ["#38a8ec", "#3b78e6"],
    gris: ["#d5dbe4", "#a7b2c2"],
    texto: ["#ffffff", "#cfeefc"],
    lema: "#c3cddc",
    nodoGris: "#c3cbd8",
    nodoAzul: "#3b9ff0",
  },
} as const;

const DEGRADADOS = [
  { n: "monitor", x1: 375, y1: 130, x2: 1117, y2: 757 },
  { n: "grande", x1: 1180, y1: 180, x2: 330, y2: 740 },
  { n: "exterior", x1: 1310, y1: 300, x2: 330, y2: 820 },
  { n: "azul", x1: 545, y1: 110, x2: 970, y2: 90 },
  { n: "gris", x1: 150, y1: 600, x2: 1250, y2: 100 },
  { n: "texto", x1: 0, y1: 1010, x2: 0, y2: 1200 },
] as const;

type Props = {
  /** "normal" sobre fondos claros; "claro" sobre fondos oscuros. */
  tono?: "normal" | "claro";
  /** "icono": solo el monitor con las órbitas. "completo": incluye ITALCOMPU y el lema. */
  variante?: "icono" | "completo";
  /** Animación de entrada (dibujo de trazos) + latido suave de los nodos y brillo en la pantalla. */
  animado?: boolean;
  /** Si hay texto visible al lado con el nombre, márcalo decorativo para que no se lea dos veces. */
  decorativo?: boolean;
  className?: string;
};

/**
 * Logo vectorial de ITALCOMPU. Nítido a cualquier tamaño y sin descargar imágenes.
 * La animación respeta "reducir movimiento" del sistema (estilos en globals.css, sección "Logo").
 */
export function LogoItalcompu({ variante = "icono", tono = "normal", animado = true, decorativo = false, className }: Props) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `li-${base}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;
  const completo = variante === "completo";
  const pal = PALETAS[tono];
  const pintura = (c: string) => (c.startsWith("#") ? c : url(c));
  const colorNodo = (c: string) => (c === "gris" ? pal.nodoGris : c === "azul" ? pal.nodoAzul : c);
  const retraso = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

  return (
    <svg
      viewBox={completo ? "0 0 1492 1342" : "120 0 1262 936"}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("logo-ital", animado && "logo-animado", className)}
      {...(decorativo ? { "aria-hidden": true } : { role: "img", "aria-label": "ITALCOMPU - Vendemos soluciones" })}
    >
      <defs>
        {DEGRADADOS.map((g) => (
          <linearGradient key={g.n} id={id(g.n)} gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
            {pal[g.n].map((color, i, arr) => (
              <stop key={i} offset={arr.length === 1 ? 0 : i / (arr.length - 1)} stopColor={color} />
            ))}
          </linearGradient>
        ))}
        <linearGradient id={id("pantalla")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={tono === "claro" ? 0.16 : 1} />
          <stop offset="1" stopColor="#e8f3fb" stopOpacity={tono === "claro" ? 0.04 : 1} />
        </linearGradient>
        <linearGradient id={id("brillo")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bfe6f8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Separación blanca entre el monitor y la órbita grande que lo cruza */}
        <mask id={id("hueco")} maskUnits="userSpaceOnUse" x="0" y="0" width="1492" height="1342">
          <rect width="1492" height="1342" fill="#fff" />
          <path d={LOGO.hueco} fill="#000" />
        </mask>
        <clipPath id={id("pantalla-clip")}>
          <rect x="427" y="184" width="636" height="414" rx="6" />
        </clipPath>
        {/* Las líneas terminan con un corte recto a la misma distancia del monitor */}
        <clipPath id={id("recorte")}>
          <path clipRule="evenodd" d="M0 0H1492V1342H0ZM355 110V560H1000V110Z" />
        </clipPath>
        {/* Máscaras que "dibujan" cada trazo de inicio a fin */}
        {animado &&
          TRAZOS.map((t) => (
            <mask key={t.k} id={id(`m-${t.k}`)} maskUnits="userSpaceOnUse" x="0" y="0" width="1492" height="1342">
              <path
                d={LOGO[t.k].guia}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth="90"
                strokeLinecap="round"
                className="logo-dibujo"
                style={retraso(t.d)}
              />
            </mask>
          ))}
      </defs>

      {/* Monitor */}
      <g className="logo-monitor">
        <g mask={url("hueco")} fill={url("monitor")}>
          <path
            fillRule="evenodd"
            d="M431 130H1059A58 58 0 0 1 1117 188V592A58 58 0 0 1 1059 650H431A58 58 0 0 1 373 592V188A58 58 0 0 1 431 130ZM433 184A6 6 0 0 0 427 190V592A6 6 0 0 0 433 598H1057A6 6 0 0 0 1063 592V190A6 6 0 0 0 1057 184Z"
          />
          <rect x="655" y="640" width="180" height="104" />
          <rect x="618" y="735" width="210" height="22" rx="11" />
        </g>
        <rect x="427" y="184" width="636" height="414" rx="6" fill={url("pantalla")} mask={url("hueco")} />
        <g clipPath={url("pantalla-clip")}>
          <polygon className="logo-brillo" points="300,184 420,184 300,598 180,598" fill={url("brillo")} />
        </g>
        <circle cx="745" cy="625" r="14" fill="#fff" />
      </g>

      {/* Órbitas y líneas de circuito */}
      <g clipPath={url("recorte")}>
        {TRAZOS.map((t) => (
          <path key={t.k} d={LOGO[t.k].relleno} fill={pintura(t.color)} mask={animado ? url(`m-${t.k}`) : undefined} />
        ))}
      </g>

      {/* Nodos: aparecen y emiten una onda suave */}
      {NODOS.map((n, i) => (
        <g key={i}>
          {animado && <circle className="logo-onda" cx={n.x} cy={n.y} r={n.r} fill={colorNodo(n.c)} style={retraso(2 + i * 0.7)} />}
          <circle className="logo-nodo" cx={n.x} cy={n.y} r={n.r} fill={colorNodo(n.c)} style={retraso(n.d + 0.7)} />
        </g>
      ))}

      {completo && (
        <>
          <g fill={url("texto")}>
            {LOGO.marca.map((d, i) => (
              <path key={i} d={d} className="logo-letra" style={retraso(0.7 + i * 0.06)} />
            ))}
          </g>
          <path d={LOGO.lema} fill={pal.lema} className="logo-lema" style={retraso(1.35)} />
        </>
      )}
    </svg>
  );
}
