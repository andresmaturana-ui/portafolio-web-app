"use client";

import { useActionState, useState } from "react";
import { DEFAULT_SETTINGS, DISPLAY_FONTS, HERO_TYPES, MONO_FONTS, PALETTES, settingsStyle, type Settings } from "@/lib/settings";
import { BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { saveSettings, type SettingsState } from "../actions";

const COLORS: { name: "color_bg" | "color_text" | "color_accent"; label: string }[] = [
  { name: "color_accent", label: "Acento (botones, detalles)" },
  { name: "color_bg", label: "Fondo" },
  { name: "color_text", label: "Texto" },
];

export function SettingsForm({ initial }: { initial: Settings }) {
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

  async function onHeroMedia(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setHeroError("");
    if (file.size > 50 * 1024 * 1024) {
      setHeroError("El archivo pesa más de 50 MB. Comprímelo un poco y vuelve a intentarlo.");
      return;
    }
    setHeroUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `marca/portada-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) setHeroError(`No se pudo subir: ${error.message}`);
    else set("hero_media", supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    setHeroUploading(false);
  }

  // Al cambiar de imagen a video (o al revés) el archivo anterior ya no sirve.
  const chooseHero = (value: Settings["hero_type"]) => setS((prev) => ({ ...prev, hero_type: value, hero_media: value === prev.hero_type ? prev.hero_media : null }));

  return (
    <form action={formAction} className="form settings">
      <input type="hidden" name="logo_url" value={s.logo_url ?? ""} />
      <input type="hidden" name="hero_media" value={s.hero_type === "logo" ? "" : (s.hero_media ?? "")} />

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
            {s.hero_media && (
              <div className="hero-preview">
                {s.hero_type === "video" ? <video src={s.hero_media} muted playsInline autoPlay loop /> : <img src={s.hero_media} alt="Portada" />}
              </div>
            )}
            <label className="btn btn--ghost" style={{ cursor: "pointer", width: "fit-content" }}>
              {heroUploading ? "Subiendo…" : s.hero_media ? "Cambiar archivo" : s.hero_type === "video" ? "Subir video" : "Subir imagen"}
              <input
                type="file"
                accept={s.hero_type === "video" ? "video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
                hidden
                onChange={(e) => onHeroMedia(e.target.files)}
              />
            </label>
            <span className="label">
              {s.hero_type === "video"
                ? "MP4 corto (5 a 10 s), horizontal y de menos de 50 MB. Mientras más suave el movimiento de cámara, mejor se ve al hacer scroll."
                : "Foto bien ancha (panorámica), por ejemplo 3000 × 1200 px. Mientras más ancha, más recorrido tiene."}
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
