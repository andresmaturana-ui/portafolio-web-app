import { getSettings } from "@/lib/get-settings";
import { DISPLAY_FONTS, MONO_FONTS } from "@/lib/settings";
import { AdminHeader } from "../AdminHeader";
import { requireUser } from "../guard";
import { NotAdmin, NotConfigured } from "../Notices";
import { SettingsForm, type ProjectOption } from "./SettingsForm";
import { TABLE } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Carga todas las tipografías ofrecidas para que la vista previa las muestre al instante.
const ALL_FONTS_HREF = `https://fonts.googleapis.com/css2?${[...DISPLAY_FONTS, ...MONO_FONTS]
  .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`)
  .join("&")}&display=swap`;

export default async function SettingsPage() {
  const { supabase, isAdmin, email, adminError } = await requireUser();
  const settings = await getSettings();
  let projects: ProjectOption[] = [];
  if (supabase && isAdmin) {
    const { data } = await supabase.from(TABLE).select("slug,title,category,client,year,cover_url,gallery").order("sort").order("created_at", { ascending: false });
    projects = (data ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      client: p.client,
      year: p.year,
      images: [p.cover_url, ...(p.gallery ?? [])].filter(Boolean) as string[],
    }));
  }
  return (
    <>
      <link rel="stylesheet" href={ALL_FONTS_HREF} />
      <AdminHeader />
      <main className="admin">
        <div className="admin-top">
          <h1 className="admin-title">Ajustes del sitio</h1>
        </div>
        {!supabase && <NotConfigured />}
        {supabase && !isAdmin && <NotAdmin email={email} error={adminError} />}
        {isAdmin && <SettingsForm initial={settings} projects={projects} />}
      </main>
    </>
  );
}
