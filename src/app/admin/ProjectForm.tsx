"use client";

import { useActionState, useState } from "react";
import { BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, DEFAULT_TEMPLATE, TEMPLATES, type Category, type Project } from "@/lib/types";
import { saveProject, type FormState } from "./actions";

const IMAGE_HINTS: Record<Category, string> = {
  app: "1ª imagen: pantalla principal (celular central). 2ª y 3ª: pantallas de los celulares laterales. El resto se ve en el detalle.",
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

  return (
    <form action={formAction} className="form">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="desktop" value={JSON.stringify(desktop)} />

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
        <label htmlFor="description">Descripción (cada línea se muestra como un punto o junto a una pantalla)</label>
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
          <div className="thumbs">
            {images.map((src, i) => (
              <div key={src + i} className="thumb">
                <img src={src} alt={`Imagen ${i + 1}`} />
                {i === 0 && <span className="thumb-badge">Portada</span>}
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
              Si la app también se usa en el computador, sube aquí sus capturas. En la página del proyecto se muestra el ecosistema: el escritorio junto al
              celular. La 1ª va en el navegador grande y también aparece en la portada líquida.
            </span>
          </div>
          {desktop.length > 0 && (
            <div className="thumbs">
              {desktop.map((src, i) => (
                <div key={src + i} className="thumb thumb--wide">
                  <img src={src} alt={`Escritorio ${i + 1}`} />
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
