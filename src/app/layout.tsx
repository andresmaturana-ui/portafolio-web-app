import type { Metadata, Viewport } from "next";
import { getSettings } from "@/lib/get-settings";
import { googleFontsHref, settingsStyle } from "@/lib/settings";
import { site } from "@/lib/site";
import "./globals.css";

// SEO y vista previa al compartir (Google, Facebook, Instagram, WhatsApp, LinkedIn, X).
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: ["diseño de apps", "diseño web", "desarrollo web", "UX/UI", "diseño gráfico", "portafolio", "Chile", site.name],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  icons: { icon: "/marca/logo", apple: "/marca/logo" },
};

export const viewport: Viewport = { themeColor: "#07080a", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="es-CL" style={settingsStyle(settings)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFontsHref(settings)} />
      </head>
      <body>{children}</body>
    </html>
  );
}
