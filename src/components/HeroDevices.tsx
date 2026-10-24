"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Browser, Phone } from "@/components/Devices";
import { createLiquid, liquidSupported } from "@/components/liquid";
import type { HeroFx } from "@/lib/settings";
import { STICKER_SIZES, type Sticker } from "@/lib/types";

export type HeroItem = {
  kind: "app" | "web" | "diseno";
  src: string;
  title: string;
  slug: string;
  url: string | null;
  /* Como en las secciones: la captura corre dentro de la pantalla mientras el proyecto está al centro */
  scroll?: "vertical" | "horizontal";
  screens?: string[];
  /* Apps con versión escritorio: su primera captura de escritorio */
  desktop?: string;
  /* Fondo de la portada líquida (si no hay, se usa la portada del proyecto) */
  bg?: string;
  /* Logo del proyecto como sticker */
  sticker?: Sticker;
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
export function HeroDevices({ items, fx = "giro", auto = true, bg = true, phones = 5 }: { items: HeroItem[]; fx?: HeroFx; auto?: boolean; bg?: boolean; phones?: 3 | 5 }) {
  const liquid = fx === "liquida" || fx === "liquida-fuerte";
  // Sin WebGL (o si una imagen no se deja dibujar) la líquida pasa a carrusel.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (liquid && !liquidSupported()) setFallback(true);
  }, [liquid]);
  if (liquid && !fallback) return <HeroLiquid items={items} auto={auto} bg={bg} phones={phones} strength={fx === "liquida-fuerte" ? 0.5 : 0.22} onFail={() => setFallback(true)} />;
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

// Escena de la portada líquida: cada proyecto ocupa todo el ancho. Apps: tres celulares con distintas
// pantallas. Webs: escritorio, tablet y celular. Diseño: tres afiches. Se dibuja en un lienzo 2D y luego se derrite en WebGL.
type Device = "phone" | "tablet" | "desktop" | "poster";
type Frame = { device: Device; cx: number; cy: number; w: number; h: number; rot: number; src: string; focus: [number, number] };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// aspect: ancho/alto de la captura de escritorio (si ya cargó), para que el navegador no la recorte.
function sceneFrames(it: HeroItem, W: number, H: number, t: number, phones: 3 | 5, aspect?: number): Frame[] {
  const mobile = W < 760;
  const shots = it.screens?.length ? it.screens : [it.src];
  const pick = (k: number) => shots[k] ?? shots[k % shots.length];
  const cy = H * (mobile ? 0.42 : 0.45);
  if (it.kind === "app" && it.desktop) {
    // Ecosistema: la versión escritorio al centro y la app en dos celulares a los lados.
    // La pantalla toma la proporción de la captura (entre 16:10 y 21:9); si es más alta, corre hacia abajo.
    const a = Math.min(2.4, Math.max(1.6, aspect || 1.6));
    let dw = mobile ? W * 0.86 : Math.min(W * 0.56, 900);
    dw = Math.min(dw, H * 0.6 * a);
    const screenH = dw / a;
    const dh = screenH + Math.max(18, screenH * 0.064);
    const dy = mobile ? H * 0.34 : cy - dh * 0.06;
    const ph = mobile ? dh * 0.95 : dh * 0.9;
    const pw = ph * (9 / 19.5);
    const focus: [number, number] = [0.5, t];
    return [
      { device: "desktop", cx: W / 2, cy: dy, w: dw, h: dh, rot: 0, src: it.desktop, focus },
      { device: "phone", cx: mobile ? W * 0.76 : W / 2 + dw / 2 + pw * 0.1, cy: dy + dh * (mobile ? 0.7 : 0.2), w: pw, h: ph, rot: 0.05, src: pick(1), focus: shots[1] ? focus : [0.5, clamp01(t * 0.5 + 0.5)] },
      { device: "phone", cx: mobile ? W * 0.24 : W / 2 - dw / 2 - pw * 0.1, cy: dy + dh * (mobile ? 0.7 : 0.2), w: pw, h: ph, rot: -0.05, src: pick(0), focus },
    ];
  }
  if (it.kind === "web") {
    // Escritorio al centro, tablet a la derecha y celular a la izquierda, un poco delante.
    const dw = mobile ? W * 0.86 : Math.min(W * 0.56, 900, H * 0.62 * 1.6);
    const dh = dw * 0.625;
    const dx = mobile ? W / 2 : W * 0.47;
    const dy = mobile ? H * 0.34 : cy - dh * 0.06;
    const th = mobile ? dh * 1.05 : dh * 0.88;
    const ph = mobile ? dh * 0.95 : dh * 0.85;
    const focus: [number, number] = [0.5, t];
    return [
      { device: "desktop", cx: dx, cy: dy, w: dw, h: dh, rot: 0, src: pick(0), focus },
      { device: "tablet", cx: mobile ? W * 0.72 : dx + dw / 2 + th * 0.15, cy: dy + dh * (mobile ? 0.62 : 0.14), w: th * 0.75, h: th, rot: 0, src: pick(0), focus },
      { device: "phone", cx: mobile ? W * 0.24 : dx - dw / 2 - ph * 0.02, cy: dy + dh * (mobile ? 0.7 : 0.22), w: ph * (9 / 19.5), h: ph, rot: 0, src: pick(0), focus },
    ];
  }
  // Apps: cinco celulares en el computador (tres en el celular); diseño: tres afiches. El del centro va adelante
  // y los de los lados, más chicos y un poco girados.
  const poster = it.kind === "diseno";
  const h = poster ? Math.min(H * (mobile ? 0.36 : 0.52), 540) : Math.min(H * (mobile ? 0.5 : 0.62), 660);
  const w = poster ? h * 0.75 : h * (9 / 19.5);
  const five = !poster && !mobile && phones === 5;
  const gap = mobile ? W * 0.33 : five ? Math.min(W * 0.19, w * 1.5) : Math.min(W * 0.27, w * 2.1);
  const horizontal = it.kind === "app" && it.scroll === "horizontal";
  // Con pocas capturas, cada celular muestra otra parte: si es horizontal, pantallas seguidas; si es vertical, otra altura.
  const focus = (k: number): [number, number] =>
    poster ? [0.5, 0.5] : horizontal ? [clamp01(t * 0.4 + k * 0.15), 0.5] : shots[k] ? [0.5, t] : [0.5, clamp01(t * 0.5 + ((k * 0.23) % 0.5))];
  // Lugar (de -2 a 2) → captura: el centro lleva la portada; luego los de al lado y los de las puntas.
  const slots = five ? [-2, 2, -1, 1, 0] : [-1, 1, 0];
  const shotFor = (pos: number) => (pos === 0 ? 0 : pos === -1 ? 1 : pos === 1 ? 2 : pos === -2 ? 3 : 4);
  return slots.map((pos) => {
    const a = Math.abs(pos);
    const scale = a === 0 ? 1 : a === 1 ? (mobile ? 0.8 : 0.88) : 0.76;
    const k = shotFor(pos);
    return {
      device: poster ? "poster" : "phone",
      cx: W / 2 + pos * gap,
      cy: cy + h * 0.035 * a,
      w: w * scale,
      h: h * scale,
      rot: pos * 0.055,
      src: pick(k),
      focus: pos === 0 && !horizontal ? [0.5, t] : focus(k),
    } satisfies Frame;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// La captura «cubre» la pantalla (object-fit: cover) en la parte que indica focus.
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, focus: [number, number]) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const fa = w / h;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;
  if (iw / ih > fa) {
    sw = ih * fa;
    sx = (iw - sw) * focus[0];
  } else {
    sh = iw / fa;
    sy = (ih - sh) * focus[1];
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Fondo: una imagen de la app que llena toda la portada, muy desenfocada (se achica y se vuelve a agrandar,
// que funciona en todos los navegadores) y oscurecida, con los bordes fundidos con el color de la página.
const blurCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
function drawBackground(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number, bg: string) {
  if (blurCanvas) {
    const bw = 40;
    const bh = Math.max(1, Math.round((bw * H) / W));
    blurCanvas.width = bw;
    blurCanvas.height = bh;
    const b = blurCanvas.getContext("2d")!;
    cover(b, img, 0, 0, bw, bh, [0.5, 0.3]);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(blurCanvas, 0, 0, bw, bh, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1);
  }
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, H);
  const fade = ctx.createLinearGradient(0, 0, 0, H);
  fade.addColorStop(0, bg);
  fade.addColorStop(0.16, "rgba(0,0,0,0)");
  fade.addColorStop(0.7, "rgba(0,0,0,0)");
  fade.addColorStop(1, bg);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
}

// Sticker con el logo, pegado en la esquina de arriba del aparato principal (igual que StickerBadge).
function drawSticker(ctx: CanvasRenderingContext2D, st: Sticker, logo: HTMLImageElement | null, x: number, y: number, s: number) {
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.translate(-r, -r);
  const peel = st.style === "despegado";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = s * 0.1;
  ctx.shadowOffsetY = s * 0.05;
  ctx.save();
  if (peel) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s, 0);
    ctx.lineTo(s, s * 0.52);
    ctx.lineTo(s * 0.52, s);
    ctx.lineTo(0, s);
    ctx.closePath();
    ctx.clip();
  }
  if (st.border) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";
  }
  ctx.fillStyle = st.color;
  ctx.beginPath();
  ctx.arc(r, r, st.border ? r * 0.91 : r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (logo) {
    const box = s * (st.logo / 100);
    const k = Math.min(box / logo.naturalWidth, box / logo.naturalHeight);
    const w = logo.naturalWidth * k;
    const h = logo.naturalHeight * k;
    ctx.drawImage(logo, r - w / 2, r - h / 2, w, h);
  }
  ctx.restore();
  if (peel) {
    // La esquina doblada: el reflejo del trozo cortado sobre la línea del doblez.
    ctx.transform(0, -1, -1, 0, s * 1.52, s * 1.52);
    ctx.beginPath();
    ctx.moveTo(s, s * 0.52);
    ctx.lineTo(s, s);
    ctx.lineTo(s * 0.52, s);
    ctx.closePath();
    ctx.clip();
    const g = ctx.createLinearGradient(s, s, s * 0.5, s * 0.5);
    g.addColorStop(0, "#d9d9d9");
    g.addColorStop(0.45, "#ffffff");
    g.addColorStop(1, "#bdbdbd");
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = s * 0.06;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, f: Frame, img: HTMLImageElement | null) {
  const { w, h } = f;
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rot);
  const x = -w / 2;
  const y = -h / 2;
  const outer = f.device === "phone" ? w * 0.16 : f.device === "tablet" ? w * 0.07 : f.device === "desktop" ? 10 : 6;
  // Cuerpo del aparato con sombra.
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = f.device === "desktop" ? "#16181c" : "#0c0d10";
  roundRect(ctx, x, y, w, h, outer);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Pantalla.
  let sx = x;
  let sy = y;
  let sw = w;
  let sh = h;
  let r = outer;
  if (f.device === "phone" || f.device === "tablet") {
    const pad = w * (f.device === "phone" ? 0.04 : 0.035);
    sx += pad;
    sy += pad;
    sw -= pad * 2;
    sh -= pad * 2;
    r = Math.max(2, outer - pad);
  } else if (f.device === "desktop") {
    const bar = Math.max(18, h * 0.06);
    ctx.fillStyle = "#3a3d44";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + 16 + i * 14, y + bar / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    sy += bar;
    sh -= bar;
    r = 0;
  }
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, f.device === "desktop" ? [0, 0, outer, outer] : r);
  ctx.clip();
  ctx.fillStyle = "#111";
  ctx.fillRect(sx, sy, sw, sh);
  if (img) cover(ctx, img, sx, sy, sw, sh, f.focus);
  ctx.restore();
  if (f.device === "phone") {
    ctx.fillStyle = "#000";
    roundRect(ctx, -w * 0.14, sy + w * 0.03, w * 0.28, w * 0.065, w * 0.04);
    ctx.fill();
  }
  ctx.restore();
}

// Líquida: las pantallas pasan solas (cada una queda unos segundos mientras corre su captura y luego se
// derrite en la siguiente) o con el scroll, según Ajustes. Al pasar el dedo o el mouse se distorsiona alrededor del puntero.
const LIQUID_HOLD = 3.6;
const LIQUID_MOVE = 1.3;

function HeroLiquid({ items, auto, bg, phones, strength, onFail }: { items: HeroItem[]; auto: boolean; bg: boolean; phones: 3 | 5; strength: number; onFail: () => void }) {
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
    const imgs = new Map<string, HTMLImageElement>();
    const getImg = (src: string) => {
      let img = imgs.get(src);
      if (!img) {
        img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.src = src;
        imgs.set(src, img);
      }
      return img;
    };
    const loaded = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
    // Lista para mostrar: todas sus capturas cargaron (o fallaron).
    const ready = (i: number) =>
      [items[i].src, ...(items[i].screens ?? []), items[i].desktop, bg ? items[i].bg : undefined, items[i].sticker?.src].every((src) => !src || getImg(src).complete);
    const pageBg = getComputedStyle(el).getPropertyValue("--bg").trim() || "#07080a";
    const load = (i: number) => {
      i = ((i % n) + n) % n;
      ready(i);
    };
    // Dos lienzos 2D con la escena de cada lado de la transición; solo se redibujan si algo cambió.
    const slots = [0, 1].map(() => ({ canvas: document.createElement("canvas"), key: "" }));
    const scene = (slot: 0 | 1, i: number, t: number) => {
      const it = items[i];
      const { width, height, dpr } = liquid.size();
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      const desk = it.desktop ? getImg(it.desktop) : null;
      const frames = sceneFrames(it, W, H, Math.round(t * 500) / 500, phones, desk && loaded(desk) ? desk.naturalWidth / desk.naturalHeight : undefined);
      const imgsFor = frames.map((f) => getImg(f.src));
      const back = bg ? getImg(it.bg || it.src) : null;
      const key = `${i}|${frames.map((f) => f.focus.join(",")).join(";")}|${width}x${height}|${imgsFor.filter(loaded).length}|${back ? loaded(back) : "-"}|${it.sticker ? loaded(getImg(it.sticker.src)) : "-"}`;
      const s = slots[slot];
      if (s.key === key) return null;
      s.key = key;
      if (s.canvas.width !== width || s.canvas.height !== height) {
        s.canvas.width = width;
        s.canvas.height = height;
      }
      const ctx = s.canvas.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (back && loaded(back)) drawBackground(ctx, back, W, H, pageBg);
      frames.forEach((f, k) => drawFrame(ctx, f, loaded(imgsFor[k]) ? imgsFor[k] : null));
      if (it.sticker) {
        // Va sobre el aparato más grande, en su esquina de arriba a la derecha.
        const main = frames.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
        const size = H * (STICKER_SIZES.find((x) => x.value === it.sticker!.size)?.vh ?? 0.15) * (W < 760 ? 0.8 : 1);
        const logo = getImg(it.sticker.src);
        drawSticker(ctx, it.sticker, loaded(logo) ? logo : null, main.cx + main.w / 2 - size * 0.15, main.cy - main.h / 2 + size * 0.2, size);
      }
      return s.canvas;
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
      try {
        liquid.draw(scene(0, index, tA), scene(1, next, tB), mix, now / 1000, mouse, hover);
      } catch {
        dead = true;
        onFail();
        return;
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
      slots.forEach((x) => (x.key = ""));
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
  }, [items, strength, auto, bg, phones]);

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
