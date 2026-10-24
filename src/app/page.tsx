import Link from "next/link";
import { Fragment } from "react";
import { Browser, Phone, Tablet } from "@/components/Devices";
import { HeroDevices, type HeroItem } from "@/components/HeroDevices";
import { HeroVideo } from "@/components/HeroVideo";
import { getSettings } from "@/lib/get-settings";
import { heroLook, heroPicks, heroSlides, whatsappLink, type SectionId } from "@/lib/settings";
import { ContactForm } from "@/components/ContactForm";
import { byCategory, getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";
import type { Project } from "@/lib/types";

export const revalidate = 60;

const pad2 = (n: number) => String(n).padStart(2, "0");

export default async function Home() {
  const projects = await getPublishedProjects();
  const apps = byCategory(projects, "app");
  const webs = byCategory(projects, "web");
  const photos = byCategory(projects, "foto");
  const designs = byCategory(projects, "diseno");
  const settings = await getSettings();
  const visibleSections = settings.section_order.filter((id) => !settings.sections_hidden.includes(id));

  // Portada Web · App · Diseño: proyectos con imagen de las secciones visibles, en el orden de las secciones.
  const picks = heroPicks(settings);
  const heroItems: HeroItem[] = visibleSections
    .filter((id): id is "app" | "web" | "diseno" => id !== "foto")
    .flatMap((id) => (id === "app" ? apps : id === "web" ? webs : designs).map((p) => ({ id, p })))
    .filter(({ p }) => p.cover_url && (!picks || picks.includes(p.slug)))
    .map(({ id, p }) => ({ kind: id, src: p.cover_url!, title: p.title, slug: p.slug, url: p.link }));

  // Sin imagen o video subido (o sin proyectos para la portada Web · App · Diseño), la portada vuelve al logo.
  const hero =
    settings.hero_type === "dispositivos" ? (heroItems.length ? "dispositivos" : "logo") : settings.hero_media && settings.hero_type !== "logo" ? settings.hero_type : "logo";
  // Con más fotos la portada dura más scroll, para que cada una alcance a verse.
  const heroHeight = hero === "logo" ? 1800 : hero === "video" ? 2400 : hero === "dispositivos" ? Math.max(2400, 1400 + heroItems.length * 520) : Math.max(2400, 1200 + heroSlides(settings).length * 450);

  let n = 0;
  const next = () => pad2(++n);

  // Cada sección es una función para poder dibujarlas en el orden elegido en Ajustes.
  const sections: Record<SectionId, () => React.ReactNode> = {
    app: () => (
      <>
        {apps.map((p, i) => (
          <AppScene key={p.id} project={p} index={next()} id={i === 0 ? "apps" : undefined} />
        ))}
      </>
    ),
    web: () => (
      <>
        {webs.map((p, i) => (
          <WebScene key={p.id} project={p} index={next()} id={i === 0 ? "web" : undefined} />
        ))}
      </>
    ),
    foto: () => (
      <>
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
      </>
    ),
    diseno: () => (
      <>
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
      </>
    ),
  };

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
          {visibleSections.map((id) => {
            if (id === "app") return apps.length > 0 && <a key={id} className="mono" href="#apps">Apps</a>;
            if (id === "web") return webs.length > 0 && <a key={id} className="mono hide-sm" href="#web">Web</a>;
            if (id === "foto") return <a key={id} className="mono" href="#foto">Fotografía</a>;
            return designs.length > 0 && <a key={id} className="mono hide-sm" href="#diseno">Diseño</a>;
          })}
          <a className="mono" href="#contacto">Contacto</a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="track" style={{ height: heroHeight }}>
          <div className={`stage hero--${hero}`}>
            {hero === "logo" && (
              <>
                <div className="gridbg anim k-grid" aria-hidden="true" />
                <div className="hero-ring anim k-ring" aria-hidden="true" />
                <img className="hero-logo anim k-logo" src="/marca/logo" alt={`Logo de ${site.name}`} />
              </>
            )}
            {hero === "imagen" && (
              <div
                className={`hero-pan anim ${settings.hero_dir === "rtl" ? "k-pan-rtl" : "k-pan-ltr"} look-${heroLook(settings).filter}`}
                style={{ "--tint": heroLook(settings).tint, "--amount": heroLook(settings).amount / 100 } as React.CSSProperties}
              >
                {heroSlides(settings).map((slide, i) => {
                  const caption = [slide.title, slide.client, slide.year].filter(Boolean).join(" · ");
                  const body = (
                    <>
                      <img src={slide.src} alt={slide.title ?? ""} />
                      {caption && <figcaption className="mono">{caption}{slide.slug && " →"}</figcaption>}
                    </>
                  );
                  return (
                    <figure key={slide.src + i} className="hero-slide">
                      {slide.slug ? <Link href={`/proyectos/${slide.slug}`}>{body}</Link> : body}
                    </figure>
                  );
                })}
              </div>
            )}
            {hero === "video" && <HeroVideo src={settings.hero_media!} />}
            {hero === "dispositivos" && (
              <HeroDevices items={heroItems} />
            )}
            {(hero === "imagen" || hero === "video") && <div className="hero-shade" aria-hidden="true" />}
            <div className="hero-copy">
              <h1 className={`hero-title anim ${hero === "logo" ? "k-h1" : hero === "dispositivos" ? "k-h1-early" : "k-h1-media"}`}>Apps · Web · Diseño · Foto</h1>
              <p className="mono" style={{ margin: 0 }}>
                Portafolio {new Date().getFullYear()} — haz scroll ↓
              </p>
            </div>
          </div>
        </section>

        {visibleSections.map((id) => (
          <Fragment key={id}>{sections[id]()}</Fragment>
        ))}

        <section id="contacto" className="section contact">
          <div className="contact-side rv">
            <p className="mono eyebrow">Contacto</p>
            <h2 className="contact-title">¿Construimos algo?</h2>
            <div className="contact-direct">
              {settings.contact_phone && (
                <a className="btn" href={whatsappLink(settings.contact_phone)} target="_blank" rel="noopener">
                  WhatsApp ↗
                </a>
              )}
              {settings.contact_phone && (
                <a className="contact-line" href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`}>
                  <span className="mono">Teléfono</span>
                  {settings.contact_phone}
                </a>
              )}
              {settings.contact_email && (
                <a className="contact-line" href={`mailto:${settings.contact_email}`}>
                  <span className="mono">Email</span>
                  {settings.contact_email}
                </a>
              )}
            </div>
            <div className="services">
              {site.services.map((s) => (
                <div key={s.name} className="service">
                  <span>{s.name}</span>
                  <span className="mono">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rv" style={{ flex: "1 1 420px", minWidth: 0 }}>
            <ContactForm services={site.services.map((s) => s.name)} />
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
        <Browser className="anim k-br" siteClassName="anim k-site" image={p.cover_url} url={p.link} title={p.title} alt={`${p.title} en escritorio`} />
        <Tablet className="anim k-tab" image={tablet} alt={`${p.title} en tablet`} />
        <Phone className="phone--small anim k-mob" image={mobile} alt={`${p.title} en móvil`} accent />
      </div>
    </section>
  );
}
