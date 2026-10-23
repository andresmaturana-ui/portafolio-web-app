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
  created_at?: string;
};
