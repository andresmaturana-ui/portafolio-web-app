import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Devuelve el cliente si hay sesión; indica si el usuario está en portfolio_admins.
export async function requireUser() {
  if (!isSupabaseConfigured) return { supabase: null, isAdmin: false, email: null, adminError: null } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  // La política RLS deja que cada usuario lea solo su propia fila de portfolio_admins.
  const { data, error } = await supabase.from("portfolio_admins").select("email").limit(1);
  if (error) console.error("No se pudo verificar el administrador:", error.message);
  return {
    supabase,
    isAdmin: Boolean(data?.length),
    email: user.email ?? null,
    adminError: error?.message ?? null,
  } as const;
}
