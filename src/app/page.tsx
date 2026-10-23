import Link from "next/link";
import { Browser, Phone, Tablet } from "@/components/Devices";
import { HeroVideo } from "@/components/HeroVideo";
import { getSettings } from "@/lib/get-settings";
import { heroImages } from "@/lib/settings";
import { byCategory, getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";
import type { Project } from "@/lib/types";

export const revalidate = 60;

const pad2 = (n: number) => String(n).padStart(2, "0");

export default async function Home() {
  const projects = await getPublishedProjects();
  const apps = byCategory(projects, "app").slice(0, 6);
  const webs = byCategory(projects, "web").slice(0, 3);
  const photos = byCategory(projects, "foto");
  const designs = byCategory(projects, "diseno");
  const settings = await getSettings();
  // Sin imagen o video subido, la portada vuelve al logo.
  const hero = settings.hero_media ? settings.hero_type : "logo";

  let n = 0;
  const next = () => pad2(++n);

  return (
    <>
      <header className="site-header">
        <a href="#inicio" className="brand">
          <img src="/marca/logo" alt="" />
          <span className="mono" style={{ color: "var(--text)" }}>
            {site.name}
          </span>
        </a>
        <nav className="site-nav" aria-label="Secciones">
          {apps.length > 0 && <a className="mono" href="#apps">Apps</a>}
          {webs.length > 0 && <a className="mono hide-sm" href="#web">Web</a>}
          <a className="mono" href="#foto">Fotografía</a>
          {designs.length > 0 && <a className="mono hide-sm" href="#diseno">Diseño</a>}
          <a className="mono" href="#contacto">Contacto</a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="track" style={{ height: hero === "logo" ? 1800 : 2400 }}>
          <div className={`stage hero--${hero}`}>
            {hero === "logo" && (
              <>
                <div className="gridbg anim k-grid" aria-hidden="true" />
                <div className="hero-ring anim k-ring" aria-hidden="true" />
                <img className="hero-logo anim k-logo" src="/marca/logo" alt={`Logo de ${site.name}`} />
              </>
            )}
            {hero === "imagen" && (
              <div className={`hero-pan anim ${settings.hero_dir === "rtl" ? "k-pan-rtl" : "k-pan-ltr"}`} aria-hidden="true">
                {heroImages(settings).map((src, i) => (
                  <img key={src + i} src={src} alt="" />
                ))}
              </div>
            )}
            {hero === "video" && <HeroVideo src={settings.hero_media!} />}
            {hero !== "logo" && <div className="hero-shade" aria-hidden="true" />}
            <div className="hero-copy">
              <h1 className={`hero-title anim ${hero === "logo" ? "k-h1" : "k-h1-media"}`}>Apps · Web · Diseño · Foto</h1>
              <p className="mono" style={{ margin: 0 }}>
                Portafolio {new Date().getFullYear()} — haz scroll ↓
              </p>
            </div>
          </div>
        </section>

        {apps.map((p, i) => (
          <AppScene key={p.id} project={p} index={next()} id={i === 0 ? "apps" : undefined} />
        ))}

        {webs.map((p, i) => (
          <WebScene key={p.id} project={p} index={next()} id={i === 0 ? "web" : undefined} />
        ))}

        {photos.length === 0 && (
          <section id="foto" className="section">
            <p className="mono eyebrow">{next()} — Fotografía</p>
            <h2 className="h2">Mirada propia</h2>
            <a className="btn" href={site.photoSite} style={{ marginTop: 32 }}>
              Ver mis fotografías ↗
            </a>
          </section>
        )}

        {photos.length > 0 && (
          <section id="foto" className="track" style={{ height: Math.max(1800, 900 + photos.length * 380) }}>
            <div className="stage photo-stage">
              <div className="photo-head">
                <div>
                  <p className="mono eyebrow">{next()} — Fotografía</p>
                  <h2 className="h2">Mirada propia</h2>
                </div>
                <a className="mono" href={site.photoSite}>
                  Ver galería completa ↗
                </a>
              </div>
              <div className="strip anim k-strip">
                {photos.map((p) => (
                  <Link key={p.id} href={`/proyectos/${p.slug}`} className="photo">
                    {p.cover_url && <img src={p.cover_url} alt={p.title} loading="lazy" />}
                    {!p.cover_url && <span className="mono">{p.title}</span>}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {designs.length > 0 && (
          <section id="diseno" className="section">
            <p className="mono eyebrow">{next()} — Diseño gráfico</p>
            <h2 className="h2">Identidad, piezas y sistemas</h2>
            <div className="cards">
              {designs.map((p) => (
                <Link key={p.id} href={`/proyectos/${p.slug}`} className="card rv">
                  <span className="mono">{p.summary || "Diseño"}</span>
                  <div className="card-media">{p.cover_url && <img src={p.cover_url} alt="" loading="lazy" />}</div>
                  <h3>{p.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="contacto" className="section contact">
          <div className="rv" style={{ flex: "1 1 380px" }}>
            <p className="mono eyebrow">Servicios</p>
            <h2 className="contact-title">¿Construimos algo?</h2>
          </div>
          <div className="services rv">
            {site.services.map((s) => (
              <div key={s.name} className="service">
                <span>{s.name}</span>
                <span className="mono">{s.detail}</span>
              </div>
            ))}
            <a className="btn" href={`mailto:${site.email}`} style={{ marginTop: 16, alignSelf: "flex-start" }}>
              Escríbeme
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <img src="/marca/logo" alt={`Logo de ${site.name}`} />
        <span className="mono">
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>
    </>
  );
}

function AppScene({ project: p, index, id }: { project: Project; index: string; id?: string }) {
  const [left, right] = p.gallery;
  return (
    <section id={id} className="track" style={{ height: 2300 }}>
      <div className="stage app-stage" style={{ perspective: 1200 }}>
        <div className="scene-copy anim k-txt">
          <p className="mono eyebrow">{index} — App</p>
          <h2 className="h2">{p.title}</h2>
          {p.summary && <p className="scene-sum">{p.summary}</p>}
          <Link className="mono" href={`/proyectos/${p.slug}`}>
            Ver proyecto →
          </Link>
        </div>
        <Phone className="anim k-pl" image={left} alt={`${p.title}, pantalla 2`} accent />
        <Phone className="anim k-pr" image={right} alt={`${p.title}, pantalla 3`} />
        <Phone
          className="anim k-pc"
          image={p.cover_url}
          feedClassName="anim k-feed"
          scroll={p.scroll === "horizontal" ? "horizontal" : "vertical"}
          screens={[p.cover_url, ...p.gallery].filter(Boolean) as string[]}
          scrollClassName="anim k-shot"
          alt={`${p.title}, pantalla principal`}
        />
        <div className="progress-line anim k-count" aria-hidden="true" />
      </div>
    </section>
  );
}

function WebScene({ project: p, index, id }: { project: Project; index: string; id?: string }) {
  const [tablet, mobile] = p.gallery;
  return (
    <section id={id} className="track" style={{ height: 2400 }}>
      <div className="stage" style={{ perspective: 1400 }}>
        <div className="scene-copy scene-copy--center anim k-txt">
          <p className="mono eyebrow">{index} — Web en todas las pantallas</p>
          <h2 className="h2">
            <Link href={`/proyectos/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
              {p.title}
            </Link>
          </h2>
        </div>
        <Browser className="anim k-br" siteClassName="anim k-site" image={p.cover_url} url={p.link} alt={`${p.title} en escritorio`} />
        <Tablet className="anim k-tab" image={tablet} alt={`${p.title} en tablet`} />
        <Phone className="phone--small anim k-mob" image={mobile} alt={`${p.title} en móvil`} accent />
      </div>
    </section>
  );
}
