import { Browser, Phone, Tablet } from "@/components/Devices";
import { FitBrowser } from "@/components/FitBrowser";
import { TitleRow } from "@/components/TitleLogo";
import { CATEGORIES, parseCaptions, parsePairs, type Project } from "@/lib/types";
import { img } from "@/lib/img";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

function images(p: Project) {
  return [p.cover_url, ...p.gallery].filter(Boolean) as string[];
}

// Texto que el admin escribió para cada imagen (por su URL).
function captions(p: Project) {
  return parseCaptions(p.captions);
}

// Captura que acompaña a cada imagen (celular ↔ escritorio).
function pairs(p: Project) {
  return p.category === "app" ? parsePairs(p.pairs) : {};
}

// Escritorio con un celular adelante, abajo a la izquierda.
function EcoPair({ desk, phone, p, alt, className = "" }: { desk: string; phone?: string | null; p: Project; alt: string; className?: string }) {
  return (
    <div className={`tpl-eco ${className}`}>
      <FitBrowser image={desk} url={p.link} title={p.title} alt={alt} />
      {phone && <Phone className="phone--static tpl-eco-phone" image={phone} alt={`${p.title} en el celular`} />}
    </div>
  );
}

function lines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function Meta({ p }: { p: Project }) {
  const label = CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category;
  return (
    <p className="mono eyebrow">
      {label}
      {p.year ? ` · ${p.year}` : ""}
      {p.client ? ` · ${p.client}` : ""}
    </p>
  );
}

function Cta({ p, label = "Ver en vivo ↗" }: { p: Project; label?: string }) {
  if (!p.link) return null;
  return (
    <a className="btn" href={p.link} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

/* ---------- Ecosistema: la app en el escritorio y en el celular ---------- */
function Ecosistema({ p }: { p: Project }) {
  const desk = (p.desktop ?? []).filter(Boolean);
  if (!desk.length) return null;
  const phone = images(p);
  const caps = captions(p);
  const pair = pairs(p);
  const Caption = ({ i }: { i: number }) =>
    desk.length > 1 || caps[desk[i]] ? (
      <div className="tpl-eco-cap rv">
        <span className="mono">Escritorio {pad2(i)}</span>
        {caps[desk[i]] && <p>{caps[desk[i]]}</p>}
      </div>
    ) : null;
  return (
    <section className="tpl-section">
      <p className="mono eyebrow">Ecosistema</p>
      <h2 className="tpl-eco-title">En el celular y en el escritorio</h2>
      <EcoPair
        className="rv"
        p={p}
        desk={desk[0]}
        phone={pair[desk[0]] ?? phone[0]}
        alt={caps[desk[0]] ? `${p.title} en escritorio: ${caps[desk[0]]}` : `${p.title} en escritorio`}
      />
      <Caption i={0} />
      {desk.length > 1 && (
        <div className="tpl-eco-more">
          {desk.slice(1).map((src, i) => (
            <figure key={src + i} className="tpl-eco-item">
              <EcoPair
                className="rv"
                p={p}
                desk={src}
                phone={pair[src]}
                alt={caps[src] ? `${p.title} en escritorio: ${caps[src]}` : `${p.title} en escritorio, pantalla ${i + 2}`}
              />
              <figcaption>
                <Caption i={i + 1} />
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- App · Escaparate ---------- */
export function AppEscaparate({ p }: { p: Project }) {
  const imgs = images(p);
  const caps = captions(p);
  const pair = pairs(p);
  const features = lines(p.description);
  return (
    <>
      <section className="tpl-hero tpl-hero--split">
        <div className="tpl-hero-copy">
          <Meta p={p} />
          <TitleRow src={p.logo} color={p.logo_color} opts={p.logo_opts}>
          <h1 className="tpl-title">{p.title}</h1>
        </TitleRow>
          {p.summary && <p className="tpl-lead">{p.summary}</p>}
          <div className="tpl-actions">
            <Cta p={p} label="Abrir la app ↗" />
            {imgs.length > 1 && (
              <a className="btn btn--ghost" href="#pantallas">
                Ver pantallas ↓
              </a>
            )}
          </div>
        </div>
        <div className="tpl-hero-devices">
          {imgs[1] && <Phone className="phone--static tpl-phone-back" image={imgs[1]} alt={`${p.title}, pantalla 2`} />}
          <Phone
            className="phone--static tpl-phone-front"
            image={imgs[0]}
            alt={`${p.title}, pantalla principal`}
            accent
            scroll={p.scroll === "horizontal" ? "horizontal" : "vertical"}
            screens={imgs}
            scrollClassName="shot-root"
          />
        </div>
      </section>

      <Ecosistema p={p} />

      {imgs.length > 1 && (
        <section id="pantallas" className="tpl-section">
          <p className="mono eyebrow">Pantallas</p>
          <div className="tpl-rail" tabIndex={0} aria-label="Pantallas de la app, desliza para ver más">
            {imgs.map((src, i) => (
              <figure key={src + i} className={`tpl-rail-item rv ${pair[src] ? "tpl-rail-item--pair" : ""}`}>
                {pair[src] ? (
                  <EcoPair p={p} desk={pair[src]} phone={src} alt={caps[src] ? `${p.title} en escritorio y celular: ${caps[src]}` : `${p.title}, pantalla ${i + 1} en escritorio y celular`} />
                ) : (
                  <Phone className="phone--static" image={src} alt={caps[src] ? `${p.title}: ${caps[src]}` : `${p.title}, pantalla ${i + 1}`} />
                )}
                <figcaption>
                  <span className="mono">{pad2(i)}</span>
                  {caps[src] && <p className="tpl-rail-text">{caps[src]}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="tpl-section">
          <p className="mono eyebrow">Qué hace</p>
          <div className="tpl-features">
            {features.map((f, i) => (
              <div key={i} className="tpl-feature rv">
                <span className="mono">{pad2(i)}</span>
                <p>{f}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ---------- App · Historia ---------- */
export function AppHistoria({ p }: { p: Project }) {
  const imgs = images(p);
  const story = lines(p.description);
  const caps = captions(p);
  const hasCaps = Object.keys(caps).length > 0;
  const pair = pairs(p);
  return (
    <>
      <section className="tpl-hero tpl-hero--center">
        <Meta p={p} />
        <TitleRow src={p.logo} color={p.logo_color} opts={p.logo_opts} center>
          <h1 className="tpl-title tpl-title--xl">{p.title}</h1>
        </TitleRow>
        {p.summary && <p className="tpl-lead">{p.summary}</p>}
        <div className="tpl-actions" style={{ justifyContent: "center" }}>
          <Cta p={p} label="Abrir la app ↗" />
        </div>
      </section>
      <Ecosistema p={p} />
      {imgs.map((src, i) => (
        <section key={src + i} className={`tpl-story ${i % 2 ? "tpl-story--rev" : ""}`}>
          <div className={`tpl-story-device rv ${pair[src] ? "tpl-story-device--pair" : ""}`}>
            {pair[src] ? (
              <EcoPair p={p} desk={pair[src]} phone={src} alt={caps[src] ? `${p.title} en escritorio y celular: ${caps[src]}` : `${p.title}, pantalla ${i + 1} en escritorio y celular`} />
            ) : (
              <Phone className="phone--static" image={src} alt={caps[src] ? `${p.title}: ${caps[src]}` : `${p.title}, pantalla ${i + 1}`} scroll="vertical" scrollClassName="shot-view" />
            )}
          </div>
          <div className="tpl-story-copy rv">
            <span className="tpl-num">{pad2(i)}</span>
            <p>{hasCaps ? caps[src] ?? "" : story[i] ?? (i === 0 ? p.summary : "")}</p>
          </div>
        </section>
      ))}
    </>
  );
}

/* ---------- Web · Navegador ---------- */
export function WebNavegador({ p }: { p: Project }) {
  const imgs = images(p);
  const [desktop, tablet, mobile] = imgs;
  return (
    <>
      <section className="tpl-hero tpl-hero--center">
        <Meta p={p} />
        <TitleRow src={p.logo} color={p.logo_color} opts={p.logo_opts} center>
          <h1 className="tpl-title">{p.title}</h1>
        </TitleRow>
        {p.summary && <p className="tpl-lead">{p.summary}</p>}
        <div className="tpl-actions" style={{ justifyContent: "center" }}>
          <Cta p={p} />
        </div>
      </section>
      <section className="tpl-scroll-shot">
        <div className="tpl-scroll-stage">
          <Browser className="tpl-browser" image={desktop} url={p.link} title={p.title} siteClassName="tpl-browser-site" alt={`${p.title} en escritorio`} />
        </div>
      </section>
      {(tablet || mobile) && (
        <section className="tpl-section tpl-devices">
          {tablet && <Tablet className="tpl-tablet rv" image={tablet} alt={`${p.title} en tablet`} />}
          {mobile && <Phone className="phone--static tpl-devices-phone rv" image={mobile} alt={`${p.title} en móvil`} />}
        </section>
      )}
      {p.description && (
        <section className="tpl-section">
          <p className="detail-desc">{p.description}</p>
        </section>
      )}
      {imgs.length > 3 && <ShotStack p={p} from={3} />}
    </>
  );
}

/* ---------- Web · Galería ---------- */
export function WebGaleria({ p }: { p: Project }) {
  return (
    <>
      <section className="tpl-hero tpl-split">
        <div>
          <Meta p={p} />
          <TitleRow src={p.logo} color={p.logo_color} opts={p.logo_opts}>
          <h1 className="tpl-title">{p.title}</h1>
        </TitleRow>
        </div>
        <div>
          {p.summary && <p className="tpl-lead" style={{ marginTop: 0 }}>{p.summary}</p>}
          {p.description && <p className="detail-desc">{p.description}</p>}
          <div className="tpl-actions">
            <Cta p={p} />
          </div>
        </div>
      </section>
      <ShotStack p={p} from={0} />
    </>
  );
}

function ShotStack({ p, from }: { p: Project; from: number }) {
  const caps = captions(p);
  return (
    <section className="tpl-section tpl-stack">
      {images(p)
        .slice(from)
        .map((src, i) => (
          <figure key={src + i} className="tpl-shot rv">
            <img src={img(src, 1200)} alt={caps[src] ? `${p.title}: ${caps[src]}` : `${p.title}, imagen ${from + i + 1}`} loading={i ? "lazy" : "eager"} />
            {caps[src] && (
              <figcaption className="tpl-shot-cap">
                <span className="mono">{pad2(from + i)}</span> {caps[src]}
              </figcaption>
            )}
          </figure>
        ))}
    </section>
  );
}

/* ---------- Fotos · Galería ---------- */
export function FotoGaleria({ p }: { p: Project }) {
  const imgs = images(p);
  return (
    <>
      <section className="tpl-hero tpl-hero--center">
        <Meta p={p} />
        <TitleRow src={p.logo} color={p.logo_color} opts={p.logo_opts} center>
          <h1 className="tpl-title tpl-title--xl">{p.title}</h1>
        </TitleRow>
        {p.summary && <p className="tpl-lead">{p.summary}</p>}
      </section>
      <section className="tpl-section">
        <div className="tpl-masonry">
          {imgs.map((src, i) => (
            <a key={src + i} href={`#foto-${i}`} className="tpl-masonry-item rv" aria-label={`Ampliar imagen ${i + 1}`}>
              <img src={img(src, 828)} alt={`${p.title}, foto ${i + 1}`} loading={i > 3 ? "lazy" : "eager"} />
            </a>
          ))}
        </div>
        {p.description && <p className="detail-desc" style={{ marginTop: 48 }}>{p.description}</p>}
      </section>
      {imgs.map((src, i) => (
        <div key={"lb" + i} id={`foto-${i}`} className="lightbox" role="dialog" aria-label={`Foto ${i + 1} de ${imgs.length}`}>
          <a href="#cerrar" className="lightbox-bg" aria-label="Cerrar" />
          <img src={img(src, 1920)} alt={`${p.title}, foto ${i + 1}`} loading="lazy" />
          <a href="#cerrar" className="lightbox-close" aria-label="Cerrar">✕</a>
          {i > 0 && <a href={`#foto-${i - 1}`} className="lightbox-nav lightbox-prev" aria-label="Anterior">←</a>}
          {i < imgs.length - 1 && <a href={`#foto-${i + 1}`} className="lightbox-nav lightbox-next" aria-label="Siguiente">→</a>}
          <span className="mono lightbox-count">{i + 1} / {imgs.length}</span>
        </div>
      ))}
    </>
  );
}
