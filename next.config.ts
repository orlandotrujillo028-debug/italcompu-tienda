import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // imágenes reales de productos
      { protocol: "https", hostname: "placehold.co" }, // imágenes de ejemplo del seed
    ],
  },
};

export default nextConfig;
