import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "ITALCOMPU | Vendemos soluciones",
    template: "%s | ITALCOMPU",
  },
  description:
    "Tienda de tecnología en Ecuador: laptops, computadores, componentes, periféricos, monitores, impresoras y más.",
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
