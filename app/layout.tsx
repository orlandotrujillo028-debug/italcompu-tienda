import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DESCRIPCION = "Tienda de tecnología en Ecuador: laptops, computadores, componentes, periféricos, monitores, impresoras y más.";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO), // para que las imágenes y enlaces de Open Graph sean absolutos
  title: {
    default: "ITALCOMPU | Vendemos soluciones",
    template: "%s | ITALCOMPU",
  },
  description: DESCRIPCION,
  applicationName: "ITALCOMPU",
  // Vista previa al compartir en WhatsApp, Facebook, etc. (cada producto define la suya con su foto).
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "ITALCOMPU",
    title: "ITALCOMPU | Vendemos soluciones",
    description: DESCRIPCION,
    images: [{ url: "/logo-italcompu.webp", width: 320, height: 287, alt: "ITALCOMPU - Vendemos soluciones" }],
  },
  twitter: { card: "summary" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b2f8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        {/* Abajo al centro: no tapa el header (menú, carrito) ni el botón de WhatsApp */}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
