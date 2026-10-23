"use client";

import { useEffect, useRef } from "react";

// Video de portada que avanza al bajar y retrocede al subir: el scroll dentro de la sección fija el tiempo del video.
export function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const track = video?.closest(".track") as HTMLElement | null;
    if (!video || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let target = 0;
    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      if (video.duration) {
        target = progress * (video.duration - 0.05);
        // Suaviza el salto para que no se vea a tirones.
        const diff = target - video.currentTime;
        if (Math.abs(diff) > 0.01) {
          video.currentTime += diff * 0.35;
          frame = requestAnimationFrame(update);
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    video.pause();
    window.addEventListener("scroll", onScroll, { passive: true });
    video.addEventListener("loadedmetadata", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      video.removeEventListener("loadedmetadata", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <video ref={ref} className="hero-media" src={src} muted playsInline preload="auto" aria-hidden="true" />;
}
