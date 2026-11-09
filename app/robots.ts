import type { MetadataRoute } from "next";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** /robots.txt — qué puede recorrer Google. Paneles, carrito y búsquedas quedan fuera. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/vendedor", "/cuenta", "/checkout", "/carrito", "/pedido", "/buscar", "/api", "/login", "/registro", "/recuperar-contrasena"],
      },
    ],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
