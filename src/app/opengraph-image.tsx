import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/get-settings";
import { site } from "@/lib/site";

// Imagen que se ve al compartir el sitio en WhatsApp, Facebook, Instagram, LinkedIn o X.
export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OgImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: s.color_bg, color: s.color_text }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 6, textTransform: "uppercase" }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: s.color_accent }} />
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>Apps · Web · Diseño</div>
          <div style={{ fontSize: 32, opacity: 0.7, maxWidth: 900 }}>Interfaces claras, rápidas y con identidad propia.</div>
        </div>
        <div style={{ display: "flex", height: 8, width: 240, background: s.color_accent }} />
      </div>
    ),
    size,
  );
}
