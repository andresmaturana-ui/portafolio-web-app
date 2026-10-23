import type { Metadata } from "next";
import { getSettings } from "@/lib/get-settings";
import { googleFontsHref, settingsStyle } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andrés Maturana — Apps, Web, Diseño y Fotografía",
  description: "Portafolio de Andrés Maturana: aplicaciones móviles, sitios web, diseño gráfico y fotografía.",
  icons: { icon: "/marca/logo" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="es" style={settingsStyle(settings)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFontsHref(settings)} />
      </head>
      <body>{children}</body>
    </html>
  );
}
