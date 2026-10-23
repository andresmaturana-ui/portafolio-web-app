import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, TABLE } from "@/lib/supabase/config";
import type { Category, Project } from "@/lib/types";

// Proyectos de ejemplo: se muestran mientras Supabase no esté configurado o vacío.
const sample = (p: Partial<Project> & Pick<Project, "slug" | "title" | "category">, i: number): Project => ({
  id: `sample-${i}`,
  summary: "",
  description: "",
  cover_url: null,
  gallery: [],
  link: null,
  client: null,
  year: 2026,
  featured: true,
  published: true,
  sort: i,
  ...p,
});

const shots = (name: string, n: number) => Array.from({ length: n }, (_, i) => `/proyectos/${name}-${i + 1}.jpg`);

export const SAMPLE_PROJECTS: Project[] = [
  sample({ slug: "melomaniac", title: "Melomaniac", category: "app", summary: "Marketplace de música para comprar y vender. [Detalle y tecnologías.]" }, 0),
  sample({
    slug: "kiltrazo",
    title: "Kiltrazo",
    category: "app",
    summary: "Registro de mascotas con reconocimiento facial para que vuelvan a casa si se pierden.",
    link: "https://kiltrazo.cl",
    cover_url: "/proyectos/kiltrazo-1.jpg",
    gallery: shots("kiltrazo", 5).slice(1),
    template: "app-historia",
    description: "App (PWA) para registrar mascotas gratis con un escaneo de la cara tipo Face ID.\nSi una mascota se pierde, quien la encuentra la escanea y se avisa al dueño, sin exponer sus datos.\nIncluye avisos de mascota perdida, mapa con cómo llegar, salud y vacunas, reencuentros y panel de administración.",
  }, 1),
  sample({
    slug: "senalizador",
    title: "Señalizador para ciclistas",
    category: "app",
    summary: "El teléfono se vuelve la luz trasera de la bici: giros y freno controlados por voz.",
    link: "https://bikeligts.pages.dev",
    cover_url: "/proyectos/senalizador-1.jpg",
    gallery: shots("senalizador", 3).slice(1),
  }, 2),
  sample({
    slug: "tagking",
    title: "TagKing",
    category: "app",
    summary: "Tags y grafitis geolocalizados en la ciudad, con ranking de los más grafiteados.",
    cover_url: "/proyectos/tagking-1.jpg",
    gallery: shots("tagking", 5).slice(1),
  }, 3),
  sample({
    slug: "artist",
    title: "ART?ST",
    category: "app",
    summary: "¿Quién es el artista? Arte callejero geolocalizado en la ciudad.",
    cover_url: "/proyectos/artist-1.jpg",
    gallery: ["/proyectos/artist-2.jpg", "/proyectos/artist-3.jpg"],
    template: "app-historia",
    description: "Murales, stencils y mosaicos a pantalla completa, uno a la vez, con mapa y cómo llegar.\nLos artistas pueden reclamar sus obras; incluye tiendas, galerías, exposiciones y publicidad según intereses.\nLaravel + Leaflet, instalable como app (PWA).",
  }, 4),
  ...[1, 2, 3, 4, 5, 6].map((n) => sample({ slug: `foto-${n}`, title: `[Foto ${n}]`, category: "foto" }, 10 + n)),
];

export async function getPublishedProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return SAMPLE_PROJECTS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("published", true)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("No se pudieron cargar los proyectos:", error.message);
    return SAMPLE_PROJECTS;
  }
  return data.length ? (data as Project[]) : SAMPLE_PROJECTS;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!isSupabaseConfigured) return SAMPLE_PROJECTS.find((p) => p.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
  return (data as Project | null) ?? SAMPLE_PROJECTS.find((p) => p.slug === slug) ?? null;
}

export function byCategory(projects: Project[], category: Category) {
  return projects.filter((p) => p.category === category);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
