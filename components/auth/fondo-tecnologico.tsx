// Fondo azul profundo con cuadrícula, resplandores y pistas de circuito con pulsos de luz.
// Solo CSS/SVG (sin JavaScript). Las animaciones se apagan con "reducir movimiento" (globals.css).

// Pistas de circuito (coordenadas de un lienzo 800x900 que se estira para cubrir el panel).
const PISTAS = [
  "M-20 120H180Q200 120 200 140V260Q200 280 220 280H420",
  "M-20 330H90Q110 330 110 350V470Q110 490 130 490H300",
  "M820 90H640Q620 90 620 110V190Q620 210 600 210H480",
  "M820 420H700Q680 420 680 440V600Q680 620 660 620H520",
  "M140 920V760Q140 740 160 740H340Q360 740 360 720V640",
  "M560 920V820Q560 800 580 800H820",
  "M420 -20V60Q420 80 440 80H520",
];
const NODOS = [
  [420, 280], [300, 490], [480, 210], [520, 620], [360, 640], [520, 80],
];

export function FondoTecnologico({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#06184a] ${className}`}>
      {/* Degradado base */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,#0b2f8a_0%,#081f63_45%,#051440_100%)]" />
      {/* Resplandores de color */}
      <div className="auth-resplandor absolute -top-32 -left-24 size-[28rem] rounded-full bg-marca-azul/40 blur-3xl" />
      <div className="auth-resplandor absolute -right-20 bottom-[-6rem] size-[26rem] rounded-full bg-marca-cyan/25 blur-3xl [animation-delay:-6s]" />
      {/* Cuadrícula que se desvanece hacia los bordes */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
      {/* Circuito */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
        <g fill="none" strokeWidth="1.5" strokeLinecap="round">
          {PISTAS.map((d, i) => (
            <path key={`p${i}`} d={d} stroke="rgba(255,255,255,0.12)" />
          ))}
          {PISTAS.map((d, i) => (
            <path
              key={`l${i}`}
              d={d}
              pathLength={100}
              stroke="#5fd4f5"
              strokeWidth="2.5"
              className="auth-pulso"
              style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${6 + (i % 3)}s` }}
            />
          ))}
        </g>
        {NODOS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="#12b4e6" opacity="0.15" className="auth-nodo" style={{ animationDelay: `${i * 0.6}s` }} />
            <circle cx={x} cy={y} r="3.5" fill="#7fdcf7" />
          </g>
        ))}
      </svg>
    </div>
  );
}
