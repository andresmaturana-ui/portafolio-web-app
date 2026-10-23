import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Devuelve el cliente si hay sesión; indica si el usuario está en portfolio_admins.
export async function requireUser() {
  if (!isSupabaseConfigured) return { supabase: null, isAdmin: false, email: null } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("portfolio_is_admin");
  return { supabase, isAdmin: Boolean(isAdmin), email: user.email ?? null } as const;
}
