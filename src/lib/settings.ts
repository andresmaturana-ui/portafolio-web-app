// Sin imports de servidor: este archivo también lo usa el formulario del admin.
export const SETTINGS_TABLE = "portfolio_settings";

export type Settings = {
  logo_url: string | null;
  font_display: string;
  font_mono: string;
  color_bg: string;
  color_text: string;
  color_accent: string;
  hero_type: HeroType;
  hero_media: string | null;
  hero_dir: HeroDir;
};

export type HeroType = "logo" | "imagen" | "video";
export type HeroDir = "ltr" | "rtl";

// La portada panorámica guarda varias fotos en hero_media, una URL por línea.
export const heroImages = (s: Pick<Settings, "hero_media">) => (s.hero_media ?? "").split("\n").map((u) => u.trim()).filter(Boolean);

export const HERO_TYPES: { value: HeroType; label: string; hint: string }[] = [
  { value: "logo", label: "Logo", hint: "El logo gira y se aleja al hacer scroll." },
  { value: "imagen", label: "Imagen panorámica", hint: "Una o varias fotos pasan de lado con el scroll." },
  { value: "video", label: "Video", hint: "El video avanza al bajar y retrocede al subir." },
];

export const DEFAULT_SETTINGS: Settings = {
  logo_url: null,
  font_display: "Space Grotesk",
  font_mono: "JetBrains Mono",
  color_bg: "#07080a",
  color_text: "#e9ecef",
  color_accent: "#c8ff3d",
  hero_type: "logo",
  hero_media: null,
  hero_dir: "ltr",
};

// Tipografías de Google Fonts que se ofrecen en el admin.
export const DISPLAY_FONTS = [
  "Space Grotesk",
  "Sora",
  "Manrope",
  "Syne",
  "Unbounded",
  "Inter",
  "Outfit",
  "Plus Jakarta Sans",
  "DM Sans",
  "Archivo",
  "Bricolage Grotesque",
  "Montserrat",
  "Poppins",
  "Playfair Display",
];

export const MONO_FONTS = ["JetBrains Mono", "IBM Plex Mono", "Space Mono", "DM Mono", "Fira Code", "Roboto Mono"];

// Paletas listas para elegir con un clic.
export const PALETTES: { name: string; bg: string; text: string; accent: string }[] = [
  { name: "Señal (lima)", bg: "#07080a", text: "#e9ecef", accent: "#c8ff3d" },
  { name: "Cian", bg: "#06090c", text: "#e6edf2", accent: "#3de0ff" },
  { name: "Naranjo", bg: "#0a0806", text: "#f0ebe6", accent: "#ff7a2f" },
  { name: "Magenta", bg: "#09070b", text: "#eee8f0", accent: "#ff3db8" },
  { name: "Violeta", bg: "#07070d", text: "#e8e8f2", accent: "#9b7bff" },
  { name: "Claro", bg: "#f3f2ee", text: "#15171a", accent: "#2b4cff" },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

export function googleFontsHref(s: Settings) {
  const fam = (name: string, weights: string) => `family=${name.replace(/ /g, "+")}:wght@${weights}`;
  return `https://fonts.googleapis.com/css2?${fam(s.font_display, "400;500;700")}&${fam(s.font_mono, "400;500")}&display=swap`;
}

export function settingsStyle(s: Settings) {
  return {
    "--bg": s.color_bg,
    "--text": s.color_text,
    "--accent": s.color_accent,
    "--font-display": `"${s.font_display}"`,
    "--font-mono": `"${s.font_mono}"`,
  } as React.CSSProperties;
}
