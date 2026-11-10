"use client";

import { usePathname } from "next/navigation";

// Mensaje grande del lado izquierdo, según la página de acceso.
const TEXTOS: Record<string, { titulo: string; texto: string }> = {
  "/login": {
    titulo: "Bienvenido de nuevo",
    texto: "Ingresa para revisar tus pedidos, tu lista de deseos y comprar en segundos.",
  },
  "/registro": {
    titulo: "Únete a ITALCOMPU",
    texto: "Crea tu cuenta gratis y compra tecnología con garantía y envío a todo Ecuador.",
  },
  "/registro-distribuidor": {
    titulo: "Crece con nosotros",
    texto: "Si tienes un local de tecnología, accede a precios especiales de distribuidor.",
  },
  "/recuperar-contrasena": {
    titulo: "Recupera tu acceso",
    texto: "Te ayudamos a crear una nueva contraseña en pocos pasos.",
  },
};

export function TituloAuth() {
  const ruta = usePathname();
  const t = TEXTOS[ruta] ?? TEXTOS["/login"];
  return (
    <div className="space-y-4">
      <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-marca-navy sm:text-5xl lg:text-6xl">{t.titulo}</h1>
      <p className="max-w-md text-base text-marca-gris lg:text-lg">{t.texto}</p>
    </div>
  );
}
