import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Fotos del bucket de Supabase: Vercel las achica y las guarda en caché (ver src/lib/img.ts).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    // Las subidas nunca cambian (cada archivo tiene nombre único), así que la copia achicada puede durar un año.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
