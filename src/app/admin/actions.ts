"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/projects";
import { DEFAULT_SETTINGS, DISPLAY_FONTS, isHex, MONO_FONTS, parseHiddenSections, parseServices, parseSectionOrder, SETTINGS_TABLE, serializeSections, type Settings } from "@/lib/settings";
import { MESSAGES_TABLE, TABLE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, parseCaptions, parseLogoOpts, parseSticker, type Category } from "@/lib/types";

export type FormState = { error?: string };

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as Category;
  if (!title) return { error: "El título es obligatorio." };
  if (!CATEGORIES.some((c) => c.value === category)) return { error: "Elige una categoría." };

  let images: string[] = [];
  let desktop: string[] = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
    desktop = category === "app" ? JSON.parse(String(formData.get("desktop") ?? "[]")) : [];
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
    scroll: formData.get("scroll") === "horizontal" ? "horizontal" : "vertical",
    cover_url: images[0] ?? null,
    gallery: images.slice(1),
    desktop,
    hero_bg: String(formData.get("hero_bg") ?? "").trim() || null,
    logo: String(formData.get("logo") ?? "").trim() || null,
    logo_color: /^#[0-9a-f]{6}$/i.test(String(formData.get("logo_color") ?? "")) ? String(formData.get("logo_color")) : null,
    logo_opts: (() => {
      const o = parseLogoOpts(String(formData.get("logo_opts") ?? ""));
      return o.mode === "derecha" && o.size === 100 ? null : JSON.stringify(o);
    })(),
    captions: (() => {
      const used = new Set([...images, ...desktop]);
      const c = Object.fromEntries(Object.entries(parseCaptions(String(formData.get("captions") ?? ""))).filter(([k]) => used.has(k)));
      return Object.keys(c).length ? JSON.stringify(c) : null;
    })(),
    sticker: (() => {
      const st = parseSticker(String(formData.get("sticker") ?? ""));
      return st ? JSON.stringify(st) : null;
    })(),
    updated_at: new Date().toISOString(),
  };

  const write = (data: Partial<typeof record>) =>
    id ? supabase.from(TABLE).update(data).eq("id", id) : supabase.from(TABLE).insert(data);
  let { error } = await write(record);
  // Base de datos sin las columnas nuevas (falta correr el SQL nuevo): guarda igual sin ellas.
  let missingDesktop = false;
  if (error && /desktop|hero_bg|sticker|logo|captions/.test(error.message)) {
    const { desktop: _d, hero_bg: _b, sticker: _k, logo: _l, logo_color: _lc, logo_opts: _lo, captions: _c, ...rest } = record;
    ({ error } = await write(rest));
    missingDesktop = !error && (desktop.length > 0 || !!record.hero_bg || !!record.sticker || !!record.logo || !!record.captions);
  }
  if (error && /template|scroll/.test(error.message)) {
    const { template: _t, scroll: _s, desktop: _d, hero_bg: _b, sticker: _k, logo: _l, logo_color: _lc, logo_opts: _lo, captions: _c, ...rest } = record;
    ({ error } = await write(rest));
  }

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un proyecto con esa URL (slug). Cambia el slug." };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/proyectos/${record.slug}`);
  if (missingDesktop) {
    return { error: "Se guardó el proyecto, pero no las capturas de escritorio, los textos de las imágenes, el fondo de portada, el sticker ni el logo: vuelve a correr supabase/ajustes.sql en el SQL Editor de Supabase y guarda otra vez." };
  }
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

export type SettingsState = { error?: string; ok?: boolean };

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const supabase = await createClient();
  const pick = (name: string, allowed: string[], fallback: string) => {
    const v = String(formData.get(name) ?? "");
    return allowed.includes(v) ? v : fallback;
  };
  const color = (name: keyof Settings) => {
    const v = String(formData.get(name) ?? "").toLowerCase();
    return isHex(v) ? v : (DEFAULT_SETTINGS[name] as string);
  };
  const record = {
    id: 1,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    font_display: pick("font_display", DISPLAY_FONTS, DEFAULT_SETTINGS.font_display),
    font_mono: pick("font_mono", MONO_FONTS, DEFAULT_SETTINGS.font_mono),
    color_bg: color("color_bg"),
    color_text: color("color_text"),
    color_accent: color("color_accent"),
    hero_type: pick("hero_type", ["logo", "dispositivos", "imagen", "video"], "logo"),
    hero_media: String(formData.get("hero_media") ?? "").trim() || null,
    hero_dir: pick("hero_dir", ["ltr", "rtl"], "ltr"),
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    services: JSON.stringify(parseServices(String(formData.get("services") ?? "[]"))),
    section_order: serializeSections(parseSectionOrder(formData.get("section_order")), parseHiddenSections(formData.get("section_order"))),
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabase.from(SETTINGS_TABLE).upsert(record);
  // Tabla sin la columna nueva (falta volver a correr ajustes.sql): guarda el resto igual.
  let missingOrder = false;
  if (error && /section_order|services/.test(error.message)) {
    const { section_order: _o, services: _sv, ...rest } = record;
    ({ error } = await supabase.from(SETTINGS_TABLE).upsert(rest));
    missingOrder = !error;
  }
  if (error) {
    if (/hero_|contact_/.test(error.message)) {
      return { error: "Falta actualizar la tabla de ajustes: vuelve a correr supabase/ajustes.sql en el SQL Editor de Supabase." };
    }
    if (/portfolio_settings/.test(error.message)) {
      return { error: "Falta crear la tabla de ajustes: corre supabase/ajustes.sql en el SQL Editor de Supabase." };
    }
    return { error: `No se pudo guardar: ${error.message}` };
  }
  revalidatePath("/", "layout");
  if (missingOrder) return { error: "Se guardó todo menos el orden de las secciones y los servicios: vuelve a correr supabase/ajustes.sql en Supabase y guarda de nuevo." };
  return { ok: true };
}

export async function markMessage(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from(MESSAGES_TABLE).update({ read: formData.get("read") === "1" }).eq("id", id);
  revalidatePath("/admin/mensajes");
}

export async function deleteMessage(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from(MESSAGES_TABLE).delete().eq("id", id);
  revalidatePath("/admin/mensajes");
}
