import Link from "next/link";
import type { Category } from "@/lib/types";
import { AdminHeader } from "../AdminHeader";
import { requireUser } from "../guard";
import { NotAdmin, NotConfigured } from "../Notices";
import { ProjectForm } from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const { supabase, isAdmin, email } = await requireUser();
  return (
    <>
      <AdminHeader />
      <main className="admin">
        <div className="admin-top">
          <h1 className="admin-title">Nuevo proyecto</h1>
          <Link className="mono" href="/admin">← Proyectos</Link>
        </div>
        {!supabase && <NotConfigured />}
        {supabase && !isAdmin && <NotAdmin email={email} />}
        {isAdmin && <ProjectForm defaultCategory={(cat as Category) ?? "app"} />}
      </main>
    </>
  );
}
