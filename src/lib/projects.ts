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

export const SAMPLE_PROJECTS: Project[] = [
  sample({ slug: "app-ejemplo", title: "[Nombre de la app]", category: "app", summary: "[Qué resuelve la app, plataforma y tecnologías.]" }, 0),
  sample({ slug: "web-ejemplo", title: "[Proyecto web]", category: "web", summary: "[Cliente, objetivo y resultado.]", link: "https://example.com" }, 1),
  ...[1, 2, 3, 4, 5, 6].map((n) => sample({ slug: `foto-${n}`, title: `[Foto ${n}]`, category: "foto" }, 10 + n)),
  sample({ slug: "marca-ejemplo", title: "[Proyecto de identidad]", category: "diseno", summary: "Marca" }, 20),
  sample({ slug: "editorial-ejemplo", title: "[Pieza editorial]", category: "diseno", summary: "Editorial" }, 21),
  sample({ slug: "packaging-ejemplo", title: "[Proyecto de packaging]", category: "diseno", summary: "Packaging" }, 22),
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
