// Datos generales del sitio. El email y el teléfono se editan en /admin/ajustes.
export const site = {
  name: "Andrés Maturana",
  // Dominio público (se cambia con NEXT_PUBLIC_SITE_URL en Vercel cuando tengas dominio propio).
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://portafolio-web-app-cyan.vercel.app").replace(/\/$/, ""),
  title: "Andrés Maturana — Diseño, apps y sitios web",
  description:
    "Portafolio de Andrés Maturana: diseño de apps móviles, sitios web y diseño gráfico. Interfaces claras, rápidas y con identidad propia. Chile.",
  photoSite: "https://www.andresmaturana.com",
  // Adónde llegan por correo los mensajes del formulario (debe ser el mismo email de la cuenta de Resend).
  notifyEmail: "andres.maturana@gmail.com",
};
