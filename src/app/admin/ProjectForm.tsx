"use client";

import { useActionState, useState } from "react";
import { BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { StickerBadge } from "@/components/StickerBadge";
import { TitleLogo } from "@/components/TitleLogo";
import { CATEGORIES, DEFAULT_TEMPLATE, parseCaptions, parsePairs, parseLogoOpts, parseSticker, STICKER_COLORS, STICKER_SIZES, TEMPLATES, type Category, type Project, type Sticker } from "@/lib/types";
import { saveProject, type FormState } from "./actions";
import { img } from "@/lib/img";

const IMAGE_HINTS: Record<Category, string> = {
  app: "Cada imagen lleva su número (01, 02…), el mismo que se ve en la página del proyecto. Cámbialo con «Número» y escribe abajo qué muestra esa pantalla. La 01 es la pantalla principal; la 02 y la 03 van en los celulares laterales de la portada.",
  web: "1ª imagen: captura de escritorio (puede ser larga, se desplaza con el scroll). 2ª: versión tablet. 3ª: versión móvil.",
  diseno: "1ª imagen: portada de la tarjeta. El resto se ve en el detalle del proyecto.",
  foto: "1ª imagen: la foto que aparece en la cinta de fotografía. El resto forma la serie en el detalle.",
};

export function ProjectForm({ project, defaultCategory = "app" }: { project?: Project; defaultCategory?: Category }) {
  const [state, formAction, saving] = useActionState<FormState, FormData>(saveProject, {});
  const [category, setCategory] = useState<Category>(project?.category ?? defaultCategory);
  const [images, setImages] = useState<string[]>(
    project ? ([project.cover_url, ...project.gallery].filter(Boolean) as string[]) : [],
  );
  const [desktop, setDesktop] = useState<string[]>(project?.desktop ?? []);
  const [heroBg, setHeroBg] = useState(project?.hero_bg ?? "");
  const [sticker, setSticker] = useState<Sticker | null>(parseSticker(project?.sticker));
  const [logo, setLogo] = useState(project?.logo ?? "");
  const [logoColor, setLogoColor] = useState(project?.logo_color ?? "");
  const [logoOpts, setLogoOpts] = useState(() => parseLogoOpts(project?.logo_opts));
  // Texto de cada imagen. Los proyectos «App · Historia» guardados antes tenían ese texto en las líneas de la descripción.
  const [captions, setCaptions] = useState<Record<string, string>>(() => {
    const saved = parseCaptions(project?.captions);
    if (Object.keys(saved).length || !project || project.template !== "app-historia") return saved;
    const lines = project.description.split("\n").map((l) => l.trim()).filter(Boolean);
    const imgs = [project.cover_url, ...project.gallery].filter(Boolean) as string[];
    return Object.fromEntries(imgs.flatMap((src, i) => (lines[i] ? [[src, lines[i]]] : [])));
  });
  const setCaption = (src: string, text: string) => setCaptions((prev) => ({ ...prev, [src]: text }));
  // Pareja de cada imagen: a un celular, una captura de escritorio; a un escritorio, una de celular.
  const [pairs, setPairs] = useState<Record<string, string>>(() => parsePairs(project?.pairs));
  const setPair = (src: string, url: string) =>
    setPairs((prev) => {
      const next = { ...prev };
      if (url) next[src] = url;
      else delete next[src];
      return next;
    });
  const editSticker = (patch: Partial<Sticker>) => setSticker((prev) => (prev ? { ...prev, ...patch } : prev));
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [template, setTemplate] = useState(project?.template ?? "");
  const [scroll, setScroll] = useState(project?.scroll ?? "vertical");
  const templates = TEMPLATES.filter((t) => t.for.includes(category));
  const autoLabel = TEMPLATES.find((t) => t.value === DEFAULT_TEMPLATE[category])?.label;

  // add: dónde se suman las imágenes subidas (capturas del proyecto o de la versión escritorio).
  async function onFiles(files: FileList | null, add: (url: string) => void = (url) => setImages((prev) => [...prev, url])) {
    if (!files?.length) return;
    setUploadError("");
    const supabase = createClient();
    setUploading(files.length);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${category}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (error) {
        setUploadError(`No se pudo subir ${file.name}: ${error.message}`);
      } else {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        add(data.publicUrl);
      }
      setUploading((n) => n - 1);
    }
  }

  const move = (i: number, to: number) =>
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });
  const remove = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));
  const moveDesktop = (i: number, to: number) =>
    setDesktop((prev) => {
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <form action={formAction} className="form">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="desktop" value={JSON.stringify(desktop)} />
      <input type="hidden" name="captions" value={JSON.stringify(captions)} />
      <input type="hidden" name="pairs" value={JSON.stringify(pairs)} />
      <input type="hidden" name="hero_bg" value={heroBg} />
      <input type="hidden" name="logo" value={logo} />
      <input type="hidden" name="logo_color" value={logoColor} />
      <input type="hidden" name="logo_opts" value={JSON.stringify(logoOpts)} />
      <input type="hidden" name="sticker" value={sticker ? JSON.stringify(sticker) : ""} />

      {state.error && <div className="notice notice--error" role="alert">{state.error}</div>}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="title">Título</label>
          <input className="input" id="title" name="title" required defaultValue={project?.title} />
        </div>
        <div className="field">
          <label htmlFor="category">Categoría</label>
          <select
            className="select"
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {category === "app" && (
        <fieldset className="field templates">
          <legend className="label">Scroll dentro del celular (portada)</legend>
          <div className="template-options">
            {[
              { value: "vertical", label: "Vertical", hint: "La captura baja dentro del celular. Ideal con una captura larga de toda la pantalla." },
              { value: "horizontal", label: "Horizontal", hint: "Las pantallas pasan de lado, como al deslizar entre ellas." },
            ].map((o) => (
              <label key={o.value} className={`template-option ${scroll === o.value ? "is-on" : ""}`}>
                <input type="radio" name="scroll" value={o.value} checked={scroll === o.value} onChange={() => setScroll(o.value as "vertical" | "horizontal")} />
                <strong>{o.label}</strong>
                <span>{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="field templates">
        <legend className="label">Plantilla de la página del proyecto</legend>
        <div className="template-options">
          <label className={`template-option ${template === "" ? "is-on" : ""}`}>
            <input type="radio" name="template" value="" checked={template === ""} onChange={() => setTemplate("")} />
            <strong>Automática</strong>
            <span>{autoLabel}</span>
          </label>
          {templates.map((t) => (
            <label key={t.value} className={`template-option ${template === t.value ? "is-on" : ""}`}>
              <input type="radio" name="template" value={t.value} checked={template === t.value} onChange={() => setTemplate(t.value)} />
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="summary">Resumen (una línea)</label>
        <input className="input" id="summary" name="summary" defaultValue={project?.summary} />
      </div>

      <div className="field">
        <label htmlFor="description">Descripción (en apps, cada línea es un punto numerado de «Qué hace»; el texto de cada pantalla se escribe abajo, en su imagen)</label>
        <textarea className="textarea" id="description" name="description" defaultValue={project?.description} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="client">Cliente</label>
          <input className="input" id="client" name="client" defaultValue={project?.client ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="year">Año</label>
          <input className="input" id="year" name="year" type="number" min="1990" max="2100" defaultValue={project?.year ?? new Date().getFullYear()} />
        </div>
        <div className="field">
          <label htmlFor="link">Enlace (sitio, App Store, Behance…)</label>
          <input className="input" id="link" name="link" type="url" placeholder="https://" defaultValue={project?.link ?? ""} />
        </div>
      </div>

      <div className="uploader">
        <div className="field">
          <span className="label">Imágenes</span>
          <span className="mono" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>{IMAGE_HINTS[category]}</span>
        </div>
        {images.length > 0 && (
          <div className="thumbs thumbs--cards">
            {images.map((src, i) => (
              <div key={src + i} className="thumb-card">
              <div className="thumb">
                <img src={img(src, 256)} alt={`Imagen ${i + 1}`} />
                <span className="thumb-badge">{i === 0 ? `${num(i)} · Portada` : num(i)}</span>
                <div className="thumb-actions">
                  {i > 0 && (
                    <button type="button" onClick={() => move(i, i - 1)} aria-label="Mover antes">
                      ←
                    </button>
                  )}
                  {i > 0 && (
                    <button type="button" onClick={() => move(i, 0)}>
                      Portada
                    </button>
                  )}
                  <button type="button" onClick={() => remove(i)} aria-label="Quitar imagen">
                    ✕
                  </button>
                </div>
              </div>
                <label className="thumb-num">
                  Número
                  <select className="input" value={i} onChange={(e) => move(i, Number(e.target.value))}>
                    {images.map((_, j) => (
                      <option key={j} value={j}>
                        {num(j)}
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  className="textarea thumb-text"
                  rows={3}
                  placeholder={`Texto del ${num(i)} (opcional)`}
                  aria-label={`Texto de la imagen ${num(i)}`}
                  value={captions[src] ?? ""}
                  onChange={(e) => setCaption(src, e.target.value)}
                />
                {category === "app" && (
                  <PairPicker
                    label="Con escritorio"
                    value={pairs[src] ?? ""}
                    options={desktop.map((d, j) => ({ value: d, label: `Escritorio ${num(j)}` }))}
                    onChange={(url) => setPair(src, url)}
                    onUpload={(files) => onFiles(files, (url) => setPair(src, url))}
                    wide
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="files">Subir desde tu equipo</label>
            <input className="input" id="files" type="file" accept="image/*" multiple onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          </div>
          <div className="field">
            <label htmlFor="url-draft">…o pegar URL de una imagen</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" id="url-draft" type="url" placeholder="https://" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => {
                  if (urlDraft.trim()) setImages((prev) => [...prev, urlDraft.trim()]);
                  setUrlDraft("");
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
        {uploading > 0 && <span className="mono">Subiendo {uploading} imagen(es)…</span>}
        {uploadError && <div className="notice notice--error" role="alert">{uploadError}</div>}
      </div>

      {category === "app" && (
        <div className="uploader">
          <div className="field">
            <span className="label">Versión escritorio (opcional)</span>
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Si la app también se usa en el computador, sube aquí sus capturas y explica cada una. En la página del proyecto van en la sección
              «Ecosistema», numeradas (Escritorio 01, 02…) con su texto. La 01 va en el navegador grande junto al celular y también aparece en la portada líquida.
            </span>
          </div>
          {desktop.length > 0 && (
            <div className="thumbs thumbs--cards thumbs--wide">
              {desktop.map((src, i) => (
                <div key={src + i} className="thumb-card">
                <div className="thumb thumb--wide">
                  <img src={img(src, 256)} alt={`Escritorio ${i + 1}`} />
                  <span className="thumb-badge">Escritorio {num(i)}</span>
                  <div className="thumb-actions">
                    {i > 0 && (
                      <button type="button" onClick={() => setDesktop((prev) => [prev[i], ...prev.filter((_, j) => j !== i)])}>
                        Primera
                      </button>
                    )}
                    <button type="button" onClick={() => setDesktop((prev) => prev.filter((_, j) => j !== i))} aria-label="Quitar captura de escritorio">
                      ✕
                    </button>
                  </div>
                </div>
                  <label className="thumb-num">
                    Número
                    <select className="input" value={i} onChange={(e) => moveDesktop(i, Number(e.target.value))}>
                      {desktop.map((_, j) => (
                        <option key={j} value={j}>
                          Escritorio {num(j)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    className="textarea thumb-text"
                    rows={3}
                    placeholder={`Qué se ve en Escritorio ${num(i)} (opcional)`}
                    aria-label={`Texto de escritorio ${num(i)}`}
                    value={captions[src] ?? ""}
                    onChange={(e) => setCaption(src, e.target.value)}
                  />
                  <PairPicker
                    label="Con celular"
                    value={pairs[src] ?? ""}
                    empty={i === 0 ? "Automático (el 01)" : "Ninguno"}
                    options={images.map((m, j) => ({ value: m, label: `Celular ${num(j)}` }))}
                    onChange={(url) => setPair(src, url)}
                    onUpload={(files) => onFiles(files, (url) => setPair(src, url))}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="field">
            <label htmlFor="desktop-files">Subir capturas de escritorio</label>
            <input
              className="input"
              id="desktop-files"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                onFiles(e.target.files, (url) => setDesktop((prev) => [...prev, url]));
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      <div className="uploader">
        <div className="field">
          <span className="label">Logo junto al nombre (opcional)</span>
          <span className="mono" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
            Va en la línea del nombre del proyecto, a la derecha de la página: en el inicio, en su página y en la portada. Mejor SVG o PNG con fondo
            transparente; así también puedes pintarlo de un color.
          </span>
        </div>
        {logo && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 40, padding: 12, borderRadius: 12, background: "var(--bg)" }}>
              <span style={{ display: "inline-block", fontSize: `${(logoOpts.size / 100) * (logoOpts.mode === "solo" ? 1.5 : 1)}em` }}>
                <TitleLogo src={logo} color={logoColor || null} />
              </span>
            </span>
            <div className="field">
              <span className="label">Cómo se ve</span>
              <div className="sticker-colors">
                <button type="button" className={`btn ${logoOpts.mode === "derecha" ? "" : "btn--ghost"}`} onClick={() => setLogoOpts({ ...logoOpts, mode: "derecha" })}>
                  Nombre + logo a la derecha
                </button>
                <button type="button" className={`btn ${logoOpts.mode === "solo" ? "" : "btn--ghost"}`} onClick={() => setLogoOpts({ ...logoOpts, mode: "solo" })}>
                  Solo el logo (sin nombre)
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="logo-size">Tamaño del logo: {logoOpts.size}%</label>
              <input
                id="logo-size"
                type="range"
                min={40}
                max={250}
                step={5}
                value={logoOpts.size}
                onChange={(e) => setLogoOpts({ ...logoOpts, size: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <span className="label">Color del logo</span>
              <div className="sticker-colors">
                <button type="button" className={`btn ${logoColor ? "btn--ghost" : ""}`} onClick={() => setLogoColor("")}>
                  Original
                </button>
                {STICKER_COLORS.map((c) => (
                  <button key={c} type="button" className={`sticker-swatch ${logoColor === c ? "is-on" : ""}`} style={{ background: c }} onClick={() => setLogoColor(c)} aria-label={`Color ${c}`} />
                ))}
                <input type="color" value={logoColor || "#ffffff"} onChange={(e) => setLogoColor(e.target.value)} aria-label="Otro color" />
              </div>
            </div>
            <button type="button" className="btn btn--danger" onClick={() => setLogo("")}>
              Quitar logo
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field">
            <label htmlFor="logo-file">{logo ? "Cambiar logo" : "Subir logo"}</label>
            <input
              className="input"
              id="logo-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                onFiles(e.target.files, (url) => setLogo(url));
                e.target.value = "";
              }}
            />
          </div>
          {sticker && sticker.src !== logo && (
            <button type="button" className="btn btn--ghost" onClick={() => setLogo(sticker.src)}>
              Usar el mismo del sticker
            </button>
          )}
        </div>
      </div>

      {category !== "foto" && (
        <div className="uploader">
          <div className="field">
            <span className="label">Logo como sticker (opcional)</span>
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Si el proyecto tiene logo, súbelo (mejor PNG o SVG con fondo transparente). Aparece como un sticker circular pegado en la
              portada líquida (solo ahí, no en la página del proyecto).
            </span>
          </div>
          {sticker && (
            <div className="sticker-admin">
              <StickerBadge sticker={sticker} />
              <div className="field" style={{ flex: 1, minWidth: 240 }}>
                <span className="label">Tamaño</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STICKER_SIZES.map((o) => (
                    <button key={o.value} type="button" className={`btn ${sticker.size === o.value ? "" : "btn--ghost"}`} onClick={() => editSticker({ size: o.value })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <label className="label" htmlFor="sticker-logo">
                  Tamaño del logo dentro del círculo: {sticker.logo}%
                </label>
                <input
                  id="sticker-logo"
                  type="range"
                  min={30}
                  max={100}
                  value={sticker.logo}
                  onChange={(e) => editSticker({ logo: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
                <span className="label">Color</span>
                <div className="sticker-colors">
                  {STICKER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`sticker-swatch ${sticker.color === c ? "is-on" : ""}`}
                      style={{ background: c }}
                      onClick={() => editSticker({ color: c })}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  <input type="color" value={sticker.color} onChange={(e) => editSticker({ color: e.target.value })} aria-label="Otro color" />
                </div>
                <span className="label">Estilo</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["pegado", "despegado"] as const).map((v) => (
                    <button key={v} type="button" className={`btn ${sticker.style === v ? "" : "btn--ghost"}`} onClick={() => editSticker({ style: v })}>
                      {v === "pegado" ? "Pegado" : "Medio despegado"}
                    </button>
                  ))}
                  <button type="button" className={`btn ${sticker.border ? "" : "btn--ghost"}`} onClick={() => editSticker({ border: !sticker.border })}>
                    {sticker.border ? "Con borde blanco" : "Sin borde"}
                  </button>
                  <button type="button" className="btn btn--danger" onClick={() => setSticker(null)}>
                    Quitar sticker
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="sticker-file">{sticker ? "Cambiar logo" : "Subir logo"}</label>
            <input
              className="input"
              id="sticker-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                onFiles(e.target.files, (url) => setSticker((prev) => ({ size: "m", color: STICKER_COLORS[0], style: "pegado", border: false, logo: 68, ...prev, src: url })));
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      {category !== "foto" && (
        <div className="uploader">
          <div className="field">
            <span className="label">Fondo en la portada (opcional)</span>
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Imagen que llena todo el fondo de la portada líquida, desenfocada y oscurecida, detrás de los aparatos. Si no subes una, se usa la portada del
              proyecto.
            </span>
          </div>
          {heroBg && (
            <div className="thumbs">
              <div className="thumb thumb--wide">
                <img src={img(heroBg, 256)} alt="Fondo de la portada" />
                <div className="thumb-actions">
                  <button type="button" onClick={() => setHeroBg("")} aria-label="Quitar fondo">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="bg-file">{heroBg ? "Cambiar fondo" : "Subir fondo"}</label>
            <input
              className="input"
              id="bg-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                onFiles(e.target.files, (url) => setHeroBg(url));
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="slug">URL del proyecto (slug)</label>
          <input className="input" id="slug" name="slug" placeholder="se genera desde el título" defaultValue={project?.slug} />
        </div>
        <div className="field">
          <label htmlFor="sort">Orden (menor aparece primero)</label>
          <input className="input" id="sort" name="sort" type="number" defaultValue={project?.sort ?? 0} />
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={project?.published ?? true} /> Publicado
          </label>
          <label className="check">
            <input type="checkbox" name="featured" defaultChecked={project?.featured ?? false} /> Destacado
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn" type="submit" disabled={saving || uploading > 0}>
          {saving ? "Guardando…" : "Guardar proyecto"}
        </button>
      </div>
    </form>
  );
}

// Elegir la captura que acompaña a una imagen: una de la otra lista o una subida solo para esto.
function PairPicker({
  label,
  value,
  options,
  onChange,
  onUpload,
  empty = "Ninguna",
  wide = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (url: string) => void;
  onUpload: (files: FileList | null) => void;
  empty?: string;
  wide?: boolean;
}) {
  const known = !value || options.some((o) => o.value === value);
  return (
    <div className="thumb-pair">
      <label className="thumb-num">
        {label}
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{empty}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {!known && <option value={value}>Subida aparte</option>}
        </select>
      </label>
      {value && <img className={`thumb-pair-img ${wide ? "thumb-pair-img--wide" : ""}`} src={img(value, 256)} alt="" />}
      <label className="thumb-pair-upload">
        Subir otra
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
