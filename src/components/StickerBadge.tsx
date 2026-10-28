import { STICKER_SIZES, type Sticker } from "@/lib/types";
import { img } from "@/lib/img";

// Logo del proyecto como sticker circular (con borde blanco recortado si se elige). «Medio despegado»: la esquina de abajo
// se levanta y se ve el reverso del sticker doblado.
export function StickerBadge({ sticker, className = "", size }: { sticker: Sticker; className?: string; size?: number }) {
  const px = size ?? STICKER_SIZES.find((x) => x.value === sticker.size)?.px ?? 140;
  return (
    <div
      className={`sticker sticker--${sticker.style} ${sticker.border ? "sticker--borde" : ""} ${className}`}
      style={{ "--s": px, "--sticker-bg": sticker.color, "--logo": `${sticker.logo}%` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="sticker-face">
        <img src={img(sticker.src, 384)} alt="" />
      </div>
      {sticker.style === "despegado" && <div className="sticker-flap" />}
    </div>
  );
}
