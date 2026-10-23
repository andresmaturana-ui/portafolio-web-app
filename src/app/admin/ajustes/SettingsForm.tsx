"use client";

import { useActionState, useState } from "react";
import {
  DEFAULT_SETTINGS,
  DISPLAY_FONTS,
  HERO_TYPES,
  HERO_FILTERS,
  heroLook,
  heroSlides,
  MONO_FONTS,
  PALETTES,
  serializeHero,
  settingsStyle,
  type HeroLook,
  type HeroSlide,
  type Settings,
} from "@/lib/settings";
import { BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { saveSettings, type SettingsState } from "../actions";

const COLORS: { name: "color_bg" | "color_text" | "color_accent"; label: string }[] = [
  { name: "color_accent", label: "Acento (botones, detalles)" },
  { name: "color_bg", label: "Fondo" },
  { name: "color_text", label: "Texto" },
];

export type ProjectOption = { slug: string; title: string; client: string | null; year: number | null; images: string[] };

export function SettingsForm({ initial, projects }: { initial: Settings; projects: ProjectOption[] }) {
  const [state, formAction, saving] = useActionState<SettingsState, FormData>(saveSettings, {});
  const [s, setS] = useState<Settings>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState("");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((prev) => ({ ...prev, [key]: value }));

  async function onLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `marca/logo-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) setUploadError(`No se pudo subir el logo: ${error.message}`);
    else set("logo_url", supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    setUploading(false);
  }

  const slides = heroSlides(s);
  const look = heroLook(s);
  const setSlides = (list: HeroSlide[]) => set("hero_media", serializeHero(list, look));
  const addSlides = (list: HeroSlide[]) => setS((prev) => ({ ...prev, hero_media: serializeHero([...heroSlides(prev), ...list], heroLook(prev)) }));
  const setLook = (patch: Partial<HeroLook>) => set("hero_media", serializeHero(slides, { ...look, ...patch }));
  const editSlide = (i: number, patch: Partial<HeroSlide>) => setSlides(slides.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const moveSlide = (i: number, to: number) => {
    const next = [...slides];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    setSlides(next);
  };
  const [picking, setPicking] = useState("");
  const pickedProject = projects.find((p) => p.slug === picking);
  // Al vincular un proyecto se completan nombre y año si estaban vacíos.
  const linkProject = (i: number, slug: string) => {
    const p = projects.find((x) => x.slug === slug);
    const cur = slides[i];
    editSlide(i, {
      slug: slug || undefined,
      title: cur.title || p?.title,
      client: cur.client || p?.client || undefined,
      year: cur.year || (p?.year ? String(p.year) : undefined),
    });
  };

  // Video: un archivo que reemplaza al anterior. Imagen: se suman fotos a la tira.
  async function onHeroMedia(files: FileList | null) {
    if (!files?.length) return;
    setHeroError("");
    const isVideo = s.hero_type === "video";
    const list = isVideo ? [files[0]] : Array.from(files);
    if (list.some((f) => f.size > 50 * 1024 * 1024)) {
      setHeroError("Hay un archivo de más de 50 MB. Comprímelo un poco y vuelve a intentarlo.");
      return;
    }
    setHeroUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of list) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `marca/portada-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (error) setHeroError(`No se pudo subir ${file.name}: ${error.message}`);
      else urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    if (urls.length) {
      if (isVideo) set("hero_media", urls[0]);
      else addSlides(urls.map((src) => ({ src })));
    }
    setHeroUploading(false);
  }

  // Al cambiar de imagen a video (o al revés) el archivo anterior ya no sirve.
  const chooseHero = (value: Settings["hero_type"]) => setS((prev) => ({ ...prev, hero_type: value, hero_media: value === prev.hero_type ? prev.hero_media : null }));

  return (
    <form action={formAction} className="form settings">
      <input type="hidden" name="logo_url" value={s.logo_url ?? ""} />
      <input type="hidden" name="hero_media" value={s.hero_type === "logo" ? "" : (s.hero_media ?? "")} />

      <section className="settings-block">
        <h2 className="settings-h">Contacto</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="contact_email">Email</label>
            <input className="input" id="contact_email" name="contact_email" type="email" value={s.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value || null)} />
          </div>
          <div className="field">
            <label htmlFor="contact_phone">Teléfono / WhatsApp</label>
            <input className="input" id="contact_phone" name="contact_phone" type="tel" placeholder="+56 9 1234 5678" value={s.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value || null)} />
          </div>
        </div>
        <span className="label">Se muestran en la sección Contacto. El teléfono lleva el código de país (+56) para que funcione el botón de WhatsApp. Los mensajes del formulario llegan a Mensajes.</span>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Logo</h2>
        <div className="settings-logo">
          <img src={s.logo_url ?? "/logo.png"} alt="Logo actual" />
          <div className="field">
            <label className="btn btn--ghost" style={{ cursor: "pointer", width: "fit-content" }}>
              {uploading ? "Subiendo…" : "Subir logo nuevo"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => onLogo(e.target.files)} />
            </label>
            <span className="label">
              PNG o SVG cuadrado, de al menos 512 px. Se usa en el menú, la animación inicial y la pestaña del navegador. Si tiene partes
              transparentes, revisa que se vean sobre el fondo.
            </span>
            {s.logo_url && (
              <button type="button" className="btn btn--ghost" style={{ width: "fit-content" }} onClick={() => set("logo_url", null)}>
                Volver al logo original
              </button>
            )}
            {uploadError && <div className="notice notice--error" role="alert">{uploadError}</div>}
          </div>
        </div>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Portada</h2>
        <div className="template-options" role="radiogroup" aria-label="Tipo de portada">
          {HERO_TYPES.map((t) => (
            <label key={t.value} className={`template-option ${s.hero_type === t.value ? "is-on" : ""}`}>
              <input type="radio" name="hero_type" value={t.value} checked={s.hero_type === t.value} onChange={() => chooseHero(t.value)} />
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </label>
          ))}
        </div>
        {s.hero_type !== "logo" && (
          <div className="field">
            {s.hero_media && s.hero_type === "video" && (
              <div className="hero-preview">
                <video src={s.hero_media} muted playsInline autoPlay loop />
              </div>
            )}
            {slides.length > 0 && s.hero_type === "imagen" && (
              <div className="slide-list">
                {slides.map((slide, i) => (
                  <div key={slide.src + i} className="slide-row">
                    <div className="thumb">
                      <img src={slide.src} alt={`Foto ${i + 1}`} />
                      <span className="thumb-badge">{i + 1}</span>
                    </div>
                    <div className="slide-fields">
                      <input className="input" placeholder="Nombre (opcional)" aria-label={`Nombre de la foto ${i + 1}`} value={slide.title ?? ""} onChange={(e) => editSlide(i, { title: e.target.value || undefined })} />
                      <input className="input" placeholder="Cliente" aria-label={`Cliente de la foto ${i + 1}`} value={slide.client ?? ""} onChange={(e) => editSlide(i, { client: e.target.value || undefined })} />
                      <input className="input" placeholder="Año" inputMode="numeric" aria-label={`Año de la foto ${i + 1}`} value={slide.year ?? ""} onChange={(e) => editSlide(i, { year: e.target.value || undefined })} />
                      <select className="select" aria-label={`Proyecto de la foto ${i + 1}`} value={slide.slug ?? ""} onChange={(e) => linkProject(i, e.target.value)}>
                        <option value="">Sin enlace a proyecto</option>
                        {projects.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            Enlaza a: {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="slide-actions">
                      <button type="button" className="btn btn--ghost" disabled={i === 0} onClick={() => moveSlide(i, i - 1)} aria-label="Mover antes">
                        ←
                      </button>
                      <button type="button" className="btn btn--ghost" disabled={i === slides.length - 1} onClick={() => moveSlide(i, i + 1)} aria-label="Mover después">
                        →
                      </button>
                      <button type="button" className="btn btn--danger" onClick={() => setSlides(slides.filter((_, j) => j !== i))} aria-label="Quitar foto">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {s.hero_type === "imagen" && projects.length > 0 && (
              <div className="field">
                <label htmlFor="pick-project">Agregar una foto de un proyecto</label>
                <select className="select" id="pick-project" value={picking} onChange={(e) => setPicking(e.target.value)}>
                  <option value="">Elige un proyecto…</option>
                  {projects.filter((p) => p.images.length).map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
                {pickedProject && (
                  <div className="thumbs">
                    {pickedProject.images.map((src) => {
                      const added = slides.some((x) => x.src === src);
                      return (
                        <button
                          key={src}
                          type="button"
                          className={`thumb thumb-pick ${added ? "is-on" : ""}`}
                          disabled={added}
                          onClick={() =>
                            addSlides([{ src, title: pickedProject.title, client: pickedProject.client ?? undefined, year: pickedProject.year ? String(pickedProject.year) : undefined, slug: pickedProject.slug }])
                          }
                        >
                          <img src={src} alt="" />
                          <span className="thumb-badge">{added ? "Agregada" : "+ Agregar"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <label className="btn btn--ghost" style={{ cursor: "pointer", width: "fit-content" }}>
              {heroUploading
                ? "Subiendo…"
                : s.hero_type === "video"
                  ? s.hero_media ? "Cambiar video" : "Subir video"
                  : slides.length ? "Subir más fotos" : "Subir fotos"}
              <input
                type="file"
                multiple={s.hero_type === "imagen"}
                accept={s.hero_type === "video" ? "video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
                hidden
                onChange={(e) => onHeroMedia(e.target.files)}
              />
            </label>
            <span className="label">
              {s.hero_type === "video"
                ? "MP4 corto (5 a 10 s), horizontal y de menos de 50 MB. Mientras más suave el movimiento de cámara, mejor se ve al hacer scroll."
                : "Sube todas las fotos que quieras (puedes elegir varias a la vez) o tómalas de tus proyectos: pasan una tras otra en este orden. A cada una le puedes poner nombre, cliente, año y enlace a su proyecto."}
            </span>
            {heroError && <div className="notice notice--error" role="alert">{heroError}</div>}
            {!s.hero_media && <span className="label">Mientras no subas un archivo, la portada sigue mostrando el logo.</span>}
          </div>
        )}
        {s.hero_type === "imagen" && (
          <fieldset className="field templates">
            <legend className="label" style={{ marginBottom: 8 }}>Dirección al hacer scroll</legend>
            <div className="template-options">
              {[
                { value: "ltr", label: "Izquierda → derecha" },
                { value: "rtl", label: "Derecha → izquierda" },
              ].map((o) => (
                <label key={o.value} className={`template-option ${s.hero_dir === o.value ? "is-on" : ""}`}>
                  <input type="radio" name="hero_dir" value={o.value} checked={s.hero_dir === o.value} onChange={() => set("hero_dir", o.value as Settings["hero_dir"])} />
                  <strong>{o.label}</strong>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {s.hero_type === "imagen" && slides.length > 0 && (
          <fieldset className="field templates">
            <legend className="label" style={{ marginBottom: 8 }}>Color de las fotos</legend>
            <div className="template-options">
              {HERO_FILTERS.map((f) => (
                <label key={f.value} className={`template-option ${look.filter === f.value ? "is-on" : ""}`}>
                  <input type="radio" name="hero_filter" value={f.value} checked={look.filter === f.value} onChange={() => setLook({ filter: f.value })} />
                  <strong>{f.label}</strong>
                  <span>{f.hint}</span>
                </label>
              ))}
            </div>
            {(look.filter === "mono" || look.filter === "tinte") && (
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field">
                  <label htmlFor="hero_tint">Color</label>
                  <div className="color-field">
                    <input type="color" id="hero_tint" value={look.tint} onChange={(e) => setLook({ tint: e.target.value })} />
                    <button type="button" className="btn btn--ghost" onClick={() => setLook({ tint: s.color_accent })}>
                      Usar el acento
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="hero_amount">Intensidad: {look.amount} %</label>
                  <input id="hero_amount" type="range" min={10} max={100} step={5} value={look.amount} onChange={(e) => setLook({ amount: Number(e.target.value) })} style={{ accentColor: "var(--accent)", minHeight: 44 }} />
                </div>
              </div>
            )}
            <div className={`hero-look-preview hero-pan look-${look.filter}`} style={{ "--tint": look.tint, "--amount": look.amount / 100 } as React.CSSProperties}>
              {slides.slice(0, 4).map((slide, i) => (
                <figure key={slide.src + i} className="hero-slide">
                  <img src={slide.src} alt="" />
                </figure>
              ))}
            </div>
          </fieldset>
        )}
        {s.hero_type !== "imagen" && <input type="hidden" name="hero_dir" value={s.hero_dir} />}
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Tipografías</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="font_display">Títulos y textos</label>
            <select className="select" id="font_display" name="font_display" value={s.font_display} onChange={(e) => set("font_display", e.target.value)}>
              {DISPLAY_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="font_mono">Etiquetas técnicas</label>
            <select className="select" id="font_mono" name="font_mono" value={s.font_mono} onChange={(e) => set("font_mono", e.target.value)}>
              {MONO_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Colores</h2>
        <div className="palettes" role="group" aria-label="Paletas listas">
          {PALETTES.map((p) => {
            const on = p.bg === s.color_bg && p.text === s.color_text && p.accent === s.color_accent;
            return (
              <button
                key={p.name}
                type="button"
                className={`palette ${on ? "is-on" : ""}`}
                aria-pressed={on}
                onClick={() => setS((prev) => ({ ...prev, color_bg: p.bg, color_text: p.text, color_accent: p.accent }))}
              >
                <span className="palette-dots" style={{ background: p.bg }}>
                  <i style={{ background: p.accent }} />
                  <i style={{ background: p.text }} />
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="form-grid">
          {COLORS.map((c) => (
            <div className="field" key={c.name}>
              <label htmlFor={c.name}>{c.label}</label>
              <div className="color-field">
                <input type="color" id={c.name} name={c.name} value={s[c.name]} onChange={(e) => set(c.name, e.target.value)} />
                <span className="mono">{s[c.name]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Vista previa</h2>
        <div className="settings-preview" style={settingsStyle(s)}>
          <div className="settings-preview-in">
            <img src={s.logo_url ?? "/logo.png"} alt="" />
            <p className="mono eyebrow">Apps · Web · Diseño · Fotografía</p>
            <p className="settings-preview-h">Andrés Maturana</p>
            <p className="settings-preview-p">Así se verán los títulos, los textos y los botones del sitio.</p>
            <span className="btn" style={{ width: "fit-content" }}>Ver proyecto</span>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" type="submit" disabled={saving || uploading || heroUploading}>
          {saving ? "Guardando…" : "Guardar ajustes"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setS(DEFAULT_SETTINGS)}>
          Restaurar diseño original
        </button>
        {state.ok && !saving && <span className="mono" role="status" style={{ color: "var(--accent)" }}>Guardado ✓</span>}
      </div>
      {state.error && <div className="notice notice--error" role="alert">{state.error}</div>}
    </form>
  );
}
