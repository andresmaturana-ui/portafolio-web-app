"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Browser, Phone } from "@/components/Devices";
import { createLiquid, liquidSupported, type LiquidShot } from "@/components/liquid";
import type { HeroFx } from "@/lib/settings";

export type HeroItem = {
  kind: "app" | "web" | "diseno";
  src: string;
  title: string;
  slug: string;
  url: string | null;
  /* Como en las secciones: la captura corre dentro de la pantalla mientras el proyecto está al centro */
  scroll?: "vertical" | "horizontal";
  screens?: string[];
};

// Dónde va el proyecto según el scroll dentro de la sección. Cada uno tiene su tramo: primero queda al
// centro mientras corre su pantalla (60 %), luego pasa al siguiente (40 %).
function heroProgress(track: HTMLElement, n: number) {
  const rect = track.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  const raw = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
  // Un poco de pausa al principio (título) y al final (último proyecto).
  const p = Math.min(1, Math.max(0, (raw - 0.12) / 0.76));
  const q = Math.min(p * n, n - 0.0001);
  const k = Math.floor(q);
  const r = q - k;
  const hold = 0.6;
  const f = k < n - 1 && r > hold ? k + (r - hold) / (1 - hold) : k;
  const screenT = (i: number) => (i < k ? 1 : i > k ? 0 : Math.min(1, r / hold));
  return { p, f, screenT };
}

const KIND_LABEL = { app: "App", web: "Web", diseno: "Diseño" } as const;

function Caption({ item, index, total }: { item?: HeroItem; index: number; total: number }) {
  if (!item) return null;
  return (
    <p className="hd-caption mono anim k-hd-cap" aria-live="polite">
      <span className="hd-kind">{KIND_LABEL[item.kind]}</span>
      {item.title}
      <span className="hd-count">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </p>
  );
}

// Portada "Web · App · Diseño": los proyectos pasan uno por uno con la transición elegida en Ajustes.
// El scroll dentro de la sección decide cuál queda al centro; al subir vuelven atrás.
export function HeroDevices({ items, fx = "giro" }: { items: HeroItem[]; fx?: HeroFx }) {
  const liquid = fx === "liquida" || fx === "liquida-fuerte";
  // Sin WebGL (o si una imagen no se deja dibujar) la líquida pasa a carrusel.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (liquid && !liquidSupported()) setFallback(true);
  }, [liquid]);
  if (liquid && !fallback) return <HeroLiquid items={items} strength={fx === "liquida-fuerte" ? 0.5 : 0.22} onFail={() => setFallback(true)} />;
  return <HeroFlow items={items} spin={fx === "giro"} />;
}

function HeroFlow({ items, spin }: { items: HeroItem[]; spin: boolean }) {
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
      const { p, f, screenT } = heroProgress(track, items.length);
      const mobile = window.innerWidth < 760;
      const gap = mobile ? window.innerWidth * 0.58 : Math.min(window.innerWidth * 0.24, 360);
      cards.current.forEach((card, i) => {
        if (!card) return;
        const d = i - f;
        const a = Math.abs(d);
        // Giro: al pasar de un lugar a otro cada pieza da una vuelta completa sobre su eje vertical; a los lados queda apenas girada.
        // Carrusel: solo se inclina hacia el centro.
        const rot = !spin ? Math.max(-55, Math.min(55, -d * 42)) : a < 1 ? -d * 360 : -Math.sign(d) * (360 + Math.min(a - 1, 1.5) * 28);
        card.style.transform = `translate(-50%, -50%) translateX(${d * gap}px) translateZ(${-a * 260}px) rotateY(${rot}deg)`;
        // La opacidad va en los hijos: en la tarjeta aplanaría el 3D y se vería la pantalla al revés al girar.
        card.style.setProperty("--o", String(a > 2.6 ? 0 : 1 - a * 0.28));
        card.style.visibility = a > 2.6 ? "hidden" : "visible";
        card.style.zIndex = String(100 - Math.round(a * 10));
        card.style.setProperty("--t", screenT(i).toFixed(3));
      });
      // Luces: --p avanza con todo el recorrido; --m es la "velocidad" (1 mientras gira, 0 cuando está quieto).
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--m", (f % 1 === 0 ? 0 : Math.sin((f % 1) * Math.PI)).toFixed(3));
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
  }, [items, spin]);

  return (
    <div ref={root} className={`hero-devices ${spin ? "" : "hero-devices--calm"}`}>
      <div className="gridbg anim k-grid" aria-hidden="true" />
      <div className="hd-fx" aria-hidden="true">
        <div className="hd-beams" />
        <div className="hd-halo" />
        <div className="hd-streak hd-streak--1" />
        <div className="hd-streak hd-streak--2" />
        <div className="hd-streak hd-streak--3" />
        <div className="hd-streak hd-streak--4" />
        <div className="hd-floor" />
      </div>
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
            {it.kind === "app" && (
              <Phone image={it.src} className="phone--static" scroll={it.scroll ?? "vertical"} screens={it.screens} scrollClassName="hd-shot" />
            )}
            {it.kind === "web" && <Browser image={it.src} url={it.url} title={it.title} siteClassName="hd-site" />}
            <span className="hd-backface" />
            {it.kind === "diseno" && (
              <div className="hd-poster">
                <img src={it.src} alt="" />
              </div>
            )}
          </Link>
        ))}
      </div>
      <Caption item={items[current]} index={current} total={items.length} />
    </div>
  );
}

// Tamaño del marco de cada tipo, en px, centrado como las tarjetas del carrusel.
function frameRect(kind: HeroItem["kind"], W: number, H: number): [number, number, number, number] {
  const mobile = W < 760;
  let w: number;
  let h: number;
  if (kind === "app") {
    h = Math.min(H * 0.56, 600);
    w = h * (9 / 19.5);
  } else if (kind === "web") {
    w = mobile ? W * 0.84 : Math.min(W * 0.46, 680);
    h = w / 1.6;
  } else {
    h = Math.min(H * (mobile ? 0.5 : 0.56), 560);
    w = h * 0.75;
  }
  return [W / 2, H * 0.44, w / 2, h / 2];
}

function HeroLiquid({ items, strength, onFail }: { items: HeroItem[]; strength: number; onFail: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const track = el?.closest(".track") as HTMLElement | null;
    if (!el || !cv || !track || !items.length) return;
    let gfx: ReturnType<typeof createLiquid> = null;
    try {
      gfx = createLiquid(cv, strength, getComputedStyle(el).getPropertyValue("--accent") || "#c8ff3d");
    } catch {
      gfx = null;
    }
    if (!gfx) {
      onFail();
      return;
    }
    const liquid = gfx;
    // Las capturas se cargan con CORS para poder dibujarlas en WebGL.
    const imgs = items.map(() => null as HTMLImageElement | null);
    const load = (i: number) => {
      if (i < 0 || i >= items.length || imgs[i]) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        imgs[i] = img;
        schedule();
      };
      img.onerror = () => onFail();
      img.src = items[i].src;
    };
    let frame = 0;
    let dead = false;
    const shot = (i: number, t: number): LiquidShot | null => {
      const img = imgs[i];
      if (!img) return null;
      const it = items[i];
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      // La captura corre dentro del marco igual que en las secciones: hacia abajo, o de lado si el proyecto es horizontal.
      const focus: [number, number] = it.kind === "diseno" ? [0.5, 0.5] : it.kind === "app" && it.scroll === "horizontal" ? [t, 0.5] : [0.5, t];
      return { img, rect: frameRect(it.kind, W, H), focus };
    };
    const render = (now: number) => {
      frame = 0;
      if (dead) return;
      const { p, f, screenT } = heroProgress(track, items.length);
      const k = Math.floor(f);
      const mix = f - k;
      [k - 1, k, k + 1, k + 2].forEach(load);
      const a = shot(k, screenT(k));
      const b = shot(Math.min(k + 1, items.length - 1), screenT(k + 1)) ?? a;
      if (a && b) {
        try {
          liquid.draw(a, b, mix, now / 1000);
        } catch {
          dead = true;
          onFail();
          return;
        }
      }
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--m", (mix === 0 ? 0 : Math.sin(mix * Math.PI)).toFixed(3));
      setCurrent(Math.round(f));
      // Mientras se derrite, el líquido sigue moviéndose aunque no se haga scroll.
      if (mix > 0 && mix < 1) schedule();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onResize = () => {
      liquid.resize();
      schedule();
    };
    load(0);
    load(1);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      dead = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
    // onFail cambia en cada render del padre; no hace falta volver a montar por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, strength]);

  const active = items[current];
  return (
    <div ref={root} className="hero-devices hero-devices--liquid">
      <div className="gridbg anim k-grid" aria-hidden="true" />
      <div className="hd-fx" aria-hidden="true">
        <div className="hd-halo" />
        <div className="hd-streak hd-streak--1" />
        <div className="hd-streak hd-streak--3" />
      </div>
      <canvas ref={canvas} className="hd-liquid" aria-hidden="true" />
      {active && <Link href={`/proyectos/${active.slug}`} className="hd-hit" aria-label={active.title} />}
      <Caption item={active} index={current} total={items.length} />
    </div>
  );
}
