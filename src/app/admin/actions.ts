"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/projects";
import { TABLE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/types";

export type FormState = { error?: string };

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as Category;
  if (!title) return { error: "El título es obligatorio." };
  if (!CATEGORIES.some((c) => c.value === category)) return { error: "Elige una categoría." };

  let images: string[] = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer las imágenes." };
  }

  const yearRaw = String(formData.get("year") ?? "").trim();
  const record = {
    title,
    category,
    slug: slugify(String(formData.get("slug") ?? "").trim() || title) || crypto.randomUUID().slice(0, 8),
    summary: String(formData.get("summary") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    link: String(formData.get("link") ?? "").trim() || null,
    client: String(formData.get("client") ?? "").trim() || null,
    year: yearRaw ? Number(yearRaw) : null,
    sort: Number(formData.get("sort") ?? 0) || 0,
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    template: String(formData.get("template") ?? "") || null,
    cover_url: images[0] ?? null,
    gallery: images.slice(1),
    updated_at: new Date().toISOString(),
  };

  const write = (data: Partial<typeof record>) =>
    id ? supabase.from(TABLE).update(data).eq("id", id) : supabase.from(TABLE).insert(data);
  let { error } = await write(record);
  // Base de datos sin la columna "template" (falta correr el SQL nuevo): guarda igual sin ella.
  if (error && /template/.test(error.message)) {
    const { template: _omit, ...rest } = record;
    ({ error } = await write(rest));
  }

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un proyecto con esa URL (slug). Cambia el slug." };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/proyectos/${record.slug}`);
  redirect(`/admin?cat=${category}`);
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from(TABLE).delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
