export type Category = "app" | "web" | "diseno" | "foto";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "app", label: "App" },
  { value: "web", label: "Web" },
  { value: "diseno", label: "Diseño gráfico" },
  { value: "foto", label: "Fotografía" },
];

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  summary: string;
  description: string;
  cover_url: string | null;
  gallery: string[];
  link: string | null;
  client: string | null;
  year: number | null;
  featured: boolean;
  published: boolean;
  sort: number;
  template?: string | null;
  scroll?: "vertical" | "horizontal" | null;
  /* Apps con versión escritorio: sus capturas, para mostrar el ecosistema completo */
  desktop?: string[] | null;
  /* Imagen de fondo para la portada líquida (vacía = la portada del proyecto) */
  hero_bg?: string | null;
  /* Logo del proyecto como sticker circular (JSON de Sticker) */
  sticker?: string | null;
  created_at?: string;
};

export type TemplateId = "app-escaparate" | "app-historia" | "web-navegador" | "web-galeria" | "foto-galeria";

export const TEMPLATES: { value: TemplateId; label: string; for: Category[]; hint: string }[] = [
  { value: "app-escaparate", label: "App · Escaparate", for: ["app"], hint: "Celular grande en la portada y todas las pantallas en una fila deslizable." },
  { value: "app-historia", label: "App · Historia", for: ["app"], hint: "Una pantalla por bloque, alternando lados, con una línea de la descripción para cada una." },
  { value: "web-navegador", label: "Web · Navegador", for: ["web", "diseno"], hint: "Navegador grande cuya captura se desplaza con el scroll, más tablet y móvil." },
  { value: "web-galeria", label: "Web · Galería", for: ["web", "diseno"], hint: "Capturas grandes una debajo de otra, con la descripción al lado." },
  { value: "foto-galeria", label: "Fotos · Galería", for: ["foto", "diseno"], hint: "Mosaico de fotos que se amplían al hacer clic." },
];

export const DEFAULT_TEMPLATE: Record<Category, TemplateId> = {
  app: "app-escaparate",
  web: "web-navegador",
  diseno: "web-galeria",
  foto: "foto-galeria",
};

export function templateFor(project: Pick<Project, "category" | "template">): TemplateId {
  const t = TEMPLATES.find((x) => x.value === project.template);
  return t ? t.value : DEFAULT_TEMPLATE[project.category];
}

// Logo del proyecto como sticker circular sobre la portada y la página del proyecto.
export type StickerSize = "s" | "m" | "l";
export type Sticker = { src: string; size: StickerSize; color: string; style: "pegado" | "despegado" };
export const STICKER_COLORS = ["#c8ff3d", "#ff3db8", "#ff7a2f", "#3de0ff", "#ffe600", "#9b7bff", "#ff3b3b", "#ffffff", "#111111"];
export const STICKER_SIZES: { value: StickerSize; label: string; px: number; vh: number }[] = [
  { value: "s", label: "Chico", px: 96, vh: 0.11 },
  { value: "m", label: "Mediano", px: 140, vh: 0.15 },
  { value: "l", label: "Grande", px: 190, vh: 0.2 },
];

export function parseSticker(raw: unknown): Sticker | null {
  try {
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!d || typeof d.src !== "string" || !d.src) return null;
    return {
      src: d.src,
      size: STICKER_SIZES.some((x) => x.value === d.size) ? d.size : "m",
      color: typeof d.color === "string" && /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : STICKER_COLORS[0],
      style: d.style === "despegado" ? "despegado" : "pegado",
    };
  } catch {
    return null;
  }
}
