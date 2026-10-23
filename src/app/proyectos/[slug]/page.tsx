import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/projects";
import { CATEGORIES } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return { title: project ? `${project.title} — Andrés Maturana` : "Proyecto" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const label = CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category;
  const images = [p.cover_url, ...p.gallery].filter(Boolean) as string[];

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="" />
          <span className="mono" style={{ color: "var(--text)" }}>← Volver</span>
        </Link>
      </header>
      <article className="detail">
        <p className="mono eyebrow">
          {label}
          {p.year ? ` · ${p.year}` : ""}
          {p.client ? ` · ${p.client}` : ""}
        </p>
        <h1 className="h2" style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>{p.title}</h1>
        {p.summary && <p style={{ fontSize: 22, color: "var(--muted)", maxWidth: "60ch" }}>{p.summary}</p>}
        {p.description && <p className="detail-desc">{p.description}</p>}
        {p.link && (
          <a className="btn" href={p.link} target="_blank" rel="noreferrer" style={{ marginTop: 16 }}>
            Ver en vivo ↗
          </a>
        )}
        <div className="detail-gallery">
          {images.map((src, i) => (
            <img key={src + i} src={src} alt={`${p.title}, imagen ${i + 1}`} loading={i ? "lazy" : "eager"} />
          ))}
        </div>
      </article>
    </>
  );
}
