// Las fotos subidas al admin pesan varios MB. En vez de pedirlas tal cual a Supabase, se piden a Vercel (/_next/image),
// que las achica, las pasa a WebP/AVIF y las guarda en su caché: Supabase entrega cada foto una sola vez.
// w tiene que ser uno de los anchos de next.config (deviceSizes o imageSizes).
export function img<T extends string | null | undefined>(src: T, w = 1080): T {
  if (!src || !/^https:\/\/[^/]+\.supabase\.co\/storage\//.test(src) || /\.svg($|\?)/i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75` as T;
}
