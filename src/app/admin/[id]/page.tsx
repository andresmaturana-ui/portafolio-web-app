import Link from "next/link";
import { notFound } from "next/navigation";
import { TABLE } from "@/lib/supabase/config";
import type { Project } from "@/lib/types";
import { AdminHeader } from "../AdminHeader";
import { requireUser } from "../guard";
import { NotAdmin, NotConfigured } from "../Notices";
import { ProjectForm } from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isAdmin, email } = await requireUser();
  let project: Project | null = null;
  if (supabase && isAdmin) {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    project = data as Project;
  }
  return (
    <>
      <AdminHeader />
      <main className="admin">
        <div className="admin-top">
          <h1 className="admin-title">Editar proyecto</h1>
          <Link className="mono" href="/admin">← Proyectos</Link>
        </div>
        {!supabase && <NotConfigured />}
        {supabase && !isAdmin && <NotAdmin email={email} />}
        {project && <ProjectForm project={project} />}
      </main>
    </>
  );
}
