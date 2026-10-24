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
export function HeroDevices({ items, fx = "giro", auto = true }: { items: HeroItem[]; fx?: HeroFx; auto?: boolean }) {
  const liquid = fx === "liquida" || fx === "liquida-fuerte";
  // Sin WebGL (o si una imagen no se deja dibujar) la líquida pasa a carrusel.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (liquid && !liquidSupported()) setFallback(true);
  }, [liquid]);
  if (liquid && !fallback) return <HeroLiquid items={items} auto={auto} strength={fx === "liquida-fuerte" ? 0.5 : 0.22} onFail={() => setFallback(true)} />;
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

// Líquida: las pantallas pasan solas (cada una queda unos segundos mientras corre su captura y luego se
// derrite en la siguiente) o con el scroll, según Ajustes. Al pasar el dedo o el mouse se distorsiona alrededor del puntero.
const LIQUID_HOLD = 3.6;
const LIQUID_MOVE = 1.3;

function HeroLiquid({ items, auto, strength, onFail }: { items: HeroItem[]; auto: boolean; strength: number; onFail: () => void }) {
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
      gfx = createLiquid(cv, strength);
    } catch {
      gfx = null;
    }
    if (!gfx) {
      onFail();
      return;
    }
    const liquid = gfx;
    const n = items.length;
    // Las capturas se cargan con CORS para poder dibujarlas en WebGL.
    const imgs = items.map(() => null as HTMLImageElement | null);
    const load = (i: number) => {
      i = ((i % n) + n) % n;
      if (imgs[i]) return;
      imgs[i] = new Image();
      const img = imgs[i]!;
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onerror = () => onFail();
      img.src = items[i].src;
    };
    const ready = (i: number) => {
      const img = imgs[i];
      return img && img.complete && img.naturalWidth ? img : null;
    };
    const shot = (i: number, t: number): LiquidShot | null => {
      const img = ready(i);
      if (!img) return null;
      const it = items[i];
      // La captura corre dentro del marco igual que en las secciones: hacia abajo, o de lado si el proyecto es horizontal.
      const focus: [number, number] = it.kind === "diseno" ? [0.5, 0.5] : it.kind === "app" && it.scroll === "horizontal" ? [t, 0.5] : [0.5, t];
      return { img, rect: frameRect(it.kind, cv.clientWidth, cv.clientHeight), focus };
    };

    // Reloj propio: solo avanza mientras la portada se ve y la imagen siguiente ya cargó.
    // pos es la pantalla a la vista (con decimales mientras se derrite); settled, la última en la que se detuvo.
    const wrap = (i: number) => ((i % n) + n) % n;
    let pos = 0;
    let settled = 0;
    let timer = 0;
    let tween: { from: number; to: number; start: number; dur: number } | null = null;
    let drag: { x0: number; y0: number; pos0: number; moved: boolean } | null = null;
    let suppressClick = false;
    let last = 0;
    let visible = true;
    let frame = 0;
    let dead = false;
    const mouse: [number, number] = [-9999, -9999];
    const target: [number, number] = [-9999, -9999];
    let hover = 0;
    const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

    const render = (now: number) => {
      frame = 0;
      if (dead) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      let index: number;
      let next: number;
      let mix: number;
      let tA = 0;
      let tB = 0;
      if (auto) {
        if (drag) {
          // pos lo mueve el dedo.
        } else if (tween) {
          const x = Math.min(1, (now - tween.start) / tween.dur);
          pos = tween.from + (tween.to - tween.from) * ease(x);
          if (x >= 1) {
            pos = settled = tween.to;
            timer = 0;
            tween = null;
          }
        } else {
          if (n > 1 && ready(wrap(settled)) && ready(wrap(settled + 1))) timer += dt;
          if (timer >= LIQUID_HOLD) tween = { from: pos, to: settled + 1, start: now, dur: LIQUID_MOVE * 1000 };
        }
        const base = Math.floor(pos);
        index = wrap(base);
        next = wrap(base + 1);
        mix = pos - base;
        const t = Math.min(1, timer / LIQUID_HOLD);
        tA = base === settled ? t : 0;
        tB = base + 1 === settled ? t : 0;
        setCurrent(wrap(Math.round(pos)));
      } else {
        // Con el scroll: mismos tramos que el carrusel (quieto mientras corre la pantalla, luego se derrite).
        const { f, screenT } = heroProgress(track, n);
        index = Math.floor(f);
        next = Math.min(index + 1, n - 1);
        mix = f - index;
        tA = screenT(index);
        setCurrent(index);
      }
      load(index);
      load(next);
      load(index + 2);
      load(index - 1);
      mouse[0] += (target[0] - mouse[0]) * 0.18;
      mouse[1] += (target[1] - mouse[1]) * 0.18;
      hover *= 0.965;
      const a = shot(index, tA);
      const b = shot(next, tB) ?? a;
      if (a && b) {
        try {
          liquid.draw(a, b, mix, now / 1000, mouse, hover);
        } catch {
          dead = true;
          onFail();
          return;
        }
      }
      if (visible && !document.hidden) frame = requestAnimationFrame(render);
    };
    const start = () => {
      last = 0;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    const onVisibility = () => !document.hidden && visible && start();
    const point = (x: number, y: number) => {
      const r = cv.getBoundingClientRect();
      // La primera vez el puntero aparece donde está, sin cruzar la pantalla.
      if (hover < 0.01) {
        mouse[0] = x - r.left;
        mouse[1] = y - r.top;
      }
      target[0] = x - r.left;
      target[1] = y - r.top;
      hover = 1;
    };
    const onPointer = (e: PointerEvent) => {
      point(e.clientX, e.clientY);
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - drag.y0)) {
        drag.moved = true;
        el.setPointerCapture?.(e.pointerId);
      }
      // Arrastrar hacia la izquierda trae la siguiente; hacia la derecha, la anterior.
      if (drag.moved) pos = drag.pos0 - dx / (cv.clientWidth * 0.5);
    };
    // Pasar con el dedo (o arrastrando el mouse) de lado: solo cuando las pantallas pasan solas.
    const onDown = (e: PointerEvent) => {
      point(e.clientX, e.clientY);
      if (!auto || n < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
      suppressClick = false;
      drag = { x0: e.clientX, y0: e.clientY, pos0: pos, moved: false };
    };
    const onUp = () => {
      if (!drag) return;
      if (drag.moved) {
        const moved = pos - drag.pos0;
        const from = Math.round(drag.pos0);
        const to = moved > 0.12 ? from + 1 : moved < -0.12 ? from - 1 : from;
        tween = { from: pos, to, start: performance.now(), dur: 250 + Math.abs(to - pos) * 650 };
        settled = Math.round(drag.pos0);
        timer = 0;
        suppressClick = true;
      }
      drag = null;
    };
    // Si se arrastró, soltar no abre el proyecto.
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    };
    const noDrag = (e: Event) => e.preventDefault();
    const onTouch = (e: TouchEvent) => e.touches[0] && point(e.touches[0].clientX, e.touches[0].clientY);
    const onResize = () => {
      liquid.resize();
      start();
    };
    el.addEventListener("pointermove", onPointer);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", noDrag);
    el.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    start();
    return () => {
      dead = true;
      io.disconnect();
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", noDrag);
      el.removeEventListener("touchmove", onTouch);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
    // onFail cambia en cada render del padre; no hace falta volver a montar por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, strength, auto]);

  const active = items[current];
  return (
    <div ref={root} className={`hero-devices hero-devices--liquid ${auto ? "hero-devices--swipe" : ""}`}>
      <div className="gridbg anim k-grid" aria-hidden="true" />
      <canvas ref={canvas} className="hd-liquid" aria-hidden="true" />
      {active && <Link href={`/proyectos/${active.slug}`} className="hd-hit" aria-label={active.title} />}
      <Caption item={active} index={current} total={items.length} />
    </div>
  );
}
