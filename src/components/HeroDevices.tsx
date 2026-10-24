"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Browser, Phone } from "@/components/Devices";

export type HeroItem = { kind: "app" | "web" | "diseno"; src: string; title: string; slug: string; url: string | null };

// Portada "Web · App · Diseño": los proyectos pasan de lado uno por uno en 3D (estilo coverflow).
// El scroll dentro de la sección decide cuál queda al centro; al subir vuelven atrás.
export function HeroDevices({ items }: { items: HeroItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = root.current;
    const track = el?.closest(".track") as HTMLElement | null;
    if (!el || !track || !items.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      // Un poco de pausa al principio (título) y al final (último proyecto).
      const p = Math.min(1, Math.max(0, (raw - 0.12) / 0.76));
      const f = p * (items.length - 1);
      const mobile = window.innerWidth < 760;
      const gap = mobile ? window.innerWidth * 0.58 : Math.min(window.innerWidth * 0.24, 360);
      cards.current.forEach((card, i) => {
        if (!card) return;
        const d = i - f;
        const a = Math.abs(d);
        const rot = Math.max(-55, Math.min(55, -d * 42));
        card.style.transform = `translate(-50%, -50%) translateX(${d * gap}px) translateZ(${-a * 260}px) rotateY(${rot}deg)`;
        card.style.opacity = String(a > 2.6 ? 0 : 1 - a * 0.28);
        card.style.zIndex = String(100 - Math.round(a * 10));
      });
      setCurrent(Math.round(f));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  const active = items[current];
  return (
    <div ref={root} className="hero-devices">
      <div className="gridbg anim k-grid" aria-hidden="true" />
      <div className="hd-flow">
        {items.map((it, i) => (
          <Link
            key={it.slug + i}
            href={`/proyectos/${it.slug}`}
            ref={(node) => {
              cards.current[i] = node;
            }}
            className={`hd-card hd-card--${it.kind}`}
            tabIndex={i === current ? 0 : -1}
            aria-label={it.title}
          >
            {it.kind === "app" && <Phone image={it.src} className="phone--static" />}
            {it.kind === "web" && <Browser image={it.src} url={it.url} title={it.title} />}
            {it.kind === "diseno" && (
              <div className="hd-poster">
                <img src={it.src} alt="" />
              </div>
            )}
          </Link>
        ))}
      </div>
      {active && (
        <p className="hd-caption mono anim k-hd-cap" aria-live="polite">
          <span className="hd-kind">{active.kind === "app" ? "App" : active.kind === "web" ? "Web" : "Diseño"}</span>
          {active.title}
          <span className="hd-count">
            {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
        </p>
      )}
    </div>
  );
}
