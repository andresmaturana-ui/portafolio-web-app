import Link from "next/link";
import { TABLE } from "@/lib/supabase/config";
import { CATEGORIES, type Project } from "@/lib/types";
import { deleteProject } from "./actions";
import { AdminHeader } from "./AdminHeader";
import { requireUser } from "./guard";
import { NotAdmin, NotConfigured } from "./Notices";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const { supabase, isAdmin, email } = await requireUser();

  let projects: Project[] = [];
  if (supabase && isAdmin) {
    let query = supabase.from(TABLE).select("*").order("sort").order("created_at", { ascending: false });
    if (cat) query = query.eq("category", cat);
    const { data } = await query;
    projects = (data as Project[]) ?? [];
  }

  return (
    <>
      <AdminHeader />
      <main className="admin">
        <div className="admin-top">
          <h1 className="admin-title">Proyectos</h1>
          {isAdmin && (
            <Link className="btn" href={`/admin/nuevo${cat ? `?cat=${cat}` : ""}`}>
              + Nuevo proyecto
            </Link>
          )}
        </div>
        {!supabase && <NotConfigured />}
        {supabase && !isAdmin && <NotAdmin email={email} />}
        {isAdmin && (
          <>
            <nav className="tabs" aria-label="Filtrar por categoría">
              <Link className="tab" href="/admin" aria-current={!cat ? "page" : undefined}>
                Todos
              </Link>
              {CATEGORIES.map((c) => (
                <Link key={c.value} className="tab" href={`/admin?cat=${c.value}`} aria-current={cat === c.value ? "page" : undefined}>
                  {c.label}
                </Link>
              ))}
            </nav>
            {projects.length === 0 ? (
              <div className="notice">Aún no hay proyectos aquí. Crea el primero con “Nuevo proyecto”.</div>
            ) : (
              <div className="admin-list">
                {projects.map((p) => (
                  <div key={p.id} className="admin-row">
                    <div className="admin-thumb">{p.cover_url && <img src={p.cover_url} alt="" />}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{p.title}</h3>
                      <span className="mono">
                        {CATEGORIES.find((c) => c.value === p.category)?.label} · {p.published ? "Publicado" : "Borrador"} · orden {p.sort}
                      </span>
                    </div>
                    <div className="admin-actions">
                      <Link className="btn btn--ghost" href={`/admin/${p.id}`}>
                        Editar
                      </Link>
                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="btn btn--danger" type="submit" aria-label={`Borrar ${p.title}`}>
                          Borrar
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
