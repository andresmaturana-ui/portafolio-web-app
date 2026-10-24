import { STICKER_SIZES, type Sticker } from "@/lib/types";

// Logo del proyecto como sticker circular con borde blanco recortado. «Medio despegado»: la esquina de abajo
// se levanta y se ve el reverso del sticker doblado.
export function StickerBadge({ sticker, className = "", size }: { sticker: Sticker; className?: string; size?: number }) {
  const px = size ?? STICKER_SIZES.find((x) => x.value === sticker.size)?.px ?? 140;
  return (
    <div
      className={`sticker sticker--${sticker.style} ${className}`}
      style={{ "--s": px, "--sticker-bg": sticker.color } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="sticker-face">
        <img src={sticker.src} alt="" />
      </div>
      {sticker.style === "despegado" && <div className="sticker-flap" />}
    </div>
  );
}
