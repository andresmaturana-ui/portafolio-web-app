import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS, DISPLAY_FONTS, isHex, MONO_FONTS, parseHiddenSections, parseSectionOrder, SETTINGS_TABLE, type Settings } from "@/lib/settings";

// Lee los ajustes guardados; si falta la tabla o Supabase, usa los de fábrica.
export async function getSettings(): Promise<Settings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    // Sin cookies: los ajustes son públicos y así las páginas pueden seguir en caché.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error } = await supabase.from(SETTINGS_TABLE).select("*").eq("id", 1).maybeSingle();
    if (error || !data) return DEFAULT_SETTINGS;
    return {
      logo_url: data.logo_url || null,
      font_display: DISPLAY_FONTS.includes(data.font_display) ? data.font_display : DEFAULT_SETTINGS.font_display,
      font_mono: MONO_FONTS.includes(data.font_mono) ? data.font_mono : DEFAULT_SETTINGS.font_mono,
      color_bg: isHex(data.color_bg) ? data.color_bg : DEFAULT_SETTINGS.color_bg,
      color_text: isHex(data.color_text) ? data.color_text : DEFAULT_SETTINGS.color_text,
      color_accent: isHex(data.color_accent) ? data.color_accent : DEFAULT_SETTINGS.color_accent,
      hero_type: ["dispositivos", "imagen", "video"].includes(data.hero_type) ? data.hero_type : "logo",
      hero_media: data.hero_media || null,
      hero_dir: data.hero_dir === "rtl" ? "rtl" : "ltr",
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      section_order: parseSectionOrder(data.section_order),
      sections_hidden: parseHiddenSections(data.section_order),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
