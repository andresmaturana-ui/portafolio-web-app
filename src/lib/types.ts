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
