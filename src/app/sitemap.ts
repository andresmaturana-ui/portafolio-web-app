import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export const revalidate = 3600;

// Inicio y la página de cada proyecto publicado (los de ejemplo, con título entre corchetes, no van).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = (await getPublishedProjects()).filter((p) => !p.title.startsWith("["));
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({
      url: `${site.url}/proyectos/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.9 : 0.7,
      images: p.cover_url ? [p.cover_url.startsWith("http") ? p.cover_url : `${site.url}${p.cover_url}`] : undefined,
    })),
  ];
}
