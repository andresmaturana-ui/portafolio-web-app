// Acepta la URL aunque venga con ruta (p. ej. ".../rest/v1/"): solo se usa el origen.
function originOf(url: string) {
  try {
    return new URL(url.trim()).origin;
  } catch {
    return url.trim();
  }
}

export const supabaseUrl = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const BUCKET = "portfolio";
export const TABLE = "portfolio_projects";
export const MESSAGES_TABLE = "portfolio_messages";
