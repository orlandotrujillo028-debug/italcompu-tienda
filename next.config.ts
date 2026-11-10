import type { NextConfig } from "next";

// Encabezados de seguridad que el navegador aplica en todas las páginas.
const seguridad = [
  // Nadie puede mostrar la tienda dentro de un <iframe> de otro sitio (evita "clickjacking").
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // El navegador no "adivina" tipos de archivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir a otro sitio solo se comparte el dominio, no la dirección completa.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La tienda no usa cámara, micrófono ni ubicación.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Siempre HTTPS (solo tiene efecto cuando la tienda está publicada con HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // no revelar que usamos Next.js
  // El Excel de inventario se sube con una Server Action (el límite por defecto es 1 MB).
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // imágenes reales de productos
      { protocol: "https", hostname: "placehold.co" }, // imágenes de ejemplo del seed
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: seguridad }];
  },
};

export default nextConfig;
