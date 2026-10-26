import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getProjectBySlug } from "@/lib/projects";
import { site } from "@/lib/site";
import { CATEGORIES, templateFor, type Project } from "@/lib/types";
import { AppEscaparate, AppHistoria, FotoGaleria, WebGaleria, WebNavegador } from "./templates";

export const revalidate = 60;

const absolute = (src: string) => (src.startsWith("http") ? src : `${site.url}${src}`);

function describe(p: Project) {
  const kind = CATEGORIES.find((c) => c.value === p.category)?.label ?? "Proyecto";
  const text = p.summary || p.description.split("\n")[0] || `${kind} diseñada por ${site.name}.`;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Proyecto no encontrado", robots: { index: false } };
  const kind = CATEGORIES.find((c) => c.value === p.category)?.label ?? "Proyecto";
  const title = `${p.title} · ${kind}`;
  const description = describe(p);
  const images = p.cover_url ? [{ url: absolute(p.cover_url), alt: `${p.title}, ${kind.toLowerCase()} de ${site.name}` }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/proyectos/${p.slug}` },
    // Los proyectos sin publicar se pueden ver con el link, pero Google no los indexa.
    robots: p.published ? undefined : { index: false, follow: false },
    openGraph: { type: "article", url: `/proyectos/${p.slug}`, title, description, images, siteName: site.name, locale: "es_CL" },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": p.category === "app" ? "SoftwareApplication" : p.category === "web" ? "WebSite" : "CreativeWork",
          name: p.title,
          description: describe(p),
          url: `${site.url}/proyectos/${p.slug}`,
          image: [p.cover_url, ...p.gallery].filter(Boolean).map((x) => absolute(x as string)),
          ...(p.category === "app" ? { applicationCategory: "MobileApplication", operatingSystem: "Android, iOS, Web" } : {}),
          ...(p.link ? { sameAs: p.link } : {}),
          ...(p.year ? { dateCreated: String(p.year) } : {}),
          creator: { "@type": "Person", name: site.name, url: site.url },
          inLanguage: "es",
        }}
      />
      <footer className="site-footer">
        <Link className="mono" href="/#contacto">¿Construimos algo? →</Link>
        <img src="/marca/logo" alt="Logo de Andrés Maturana" />
      </footer>
    </>
  );
}
