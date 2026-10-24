"use client";

import { useEffect, useRef, useState } from "react";
import { Browser } from "@/components/Devices";

// Navegador con una captura de escritorio que se ve entera. Si la captura es más larga que la pantalla
// (una página completa), queda en formato 16:10 y baja sola con el scroll de la página.
export function FitBrowser(props: { image: string; url?: string | null; title?: string; alt?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const img = ref.current?.querySelector("img.site-shot") as HTMLImageElement | null;
    if (!img) return;
    const check = () => img.naturalWidth && setTall(img.naturalWidth / img.naturalHeight < 1.5);
    if (img.complete) check();
    img.addEventListener("load", check);
    return () => img.removeEventListener("load", check);
  }, [props.image]);
  return (
    <div ref={ref} className={`fit-browser ${tall ? "is-tall" : ""} ${props.className ?? ""}`}>
      <Browser className="tpl-eco-browser" siteClassName="tpl-browser-site" image={props.image} url={props.url} title={props.title} alt={props.alt} />
    </div>
  );
}
