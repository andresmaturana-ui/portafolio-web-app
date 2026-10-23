import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/projects";
import { templateFor } from "@/lib/types";
import { AppEscaparate, AppHistoria, FotoGaleria, WebGaleria, WebNavegador } from "./templates";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return {
    title: project ? `${project.title} — Andrés Maturana` : "Proyecto",
    description: project?.summary || undefined,
    openGraph: project?.cover_url ? { images: [project.cover_url] } : undefined,
  };
}

const TEMPLATE_COMPONENTS = {
  "app-escaparate": AppEscaparate,
  "app-historia": AppHistoria,
  "web-navegador": WebNavegador,
  "web-galeria": WebGaleria,
  "foto-galeria": FotoGaleria,
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const Template = TEMPLATE_COMPONENTS[templateFor(p)];

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <img src="/marca/logo" alt="" />
          <span className="mono" style={{ color: "var(--text)" }}>← Volver</span>
        </Link>
        {p.link && (
          <a className="mono" href={p.link} target="_blank" rel="noreferrer">
            Ver en vivo ↗
          </a>
        )}
      </header>
      <article className="tpl">
        <Template p={p} />
      </article>
      <footer className="site-footer">
        <Link className="mono" href="/#contacto">¿Construimos algo? →</Link>
        <img src="/marca/logo" alt="Logo de Andrés Maturana" />
      </footer>
    </>
  );
}
