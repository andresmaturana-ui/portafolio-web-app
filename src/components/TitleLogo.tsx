import { parseLogoOpts } from "@/lib/types";

// Logo chico del proyecto (si tiene). Con color, se pinta de ese color usando el logo como máscara:
// sirve para SVG y PNG con fondo transparente.
export function TitleLogo({ src, color, className = "" }: { src?: string | null; color?: string | null; className?: string }) {
  if (!src) return null;
  if (!color) return <img className={`title-logo ${className}`} src={src} alt="" aria-hidden="true" />;
  return (
    <span className={`title-logo title-logo--tint ${className}`} aria-hidden="true">
      <img src={src} alt="" />
      <span style={{ background: color, WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }} />
    </span>
  );
}

// El nombre del proyecto con su logo a la derecha, en la misma línea pero separado del nombre.
// center: el nombre queda centrado en la página y el logo en el borde derecho.
// opts: modo ("solo": se ve solo el logo, en el lugar del nombre; el nombre sigue en la página para Google y lectores de pantalla) y tamaño.
export function TitleRow({
  children,
  src,
  color,
  center = false,
  opts,
  size = "lg",
}: {
  children: React.ReactNode;
  src?: string | null;
  color?: string | null;
  center?: boolean;
  opts?: string | null;
  size?: "lg" | "md" | "sm";
}) {
  if (!src) return <>{children}</>;
  const { mode, size: scale } = parseLogoOpts(opts);
  const style = { "--logo-scale": scale / 100 } as React.CSSProperties;
  if (mode === "solo") {
    return (
      <div className={`title-only title-only--${size} ${center ? "title-only--center" : ""}`} style={style}>
        <div className="sr-only">{children}</div>
        <TitleLogo src={src} color={color} className="title-logo--only" />
      </div>
    );
  }
  return (
    <div className={`title-row title-row--${size} ${center ? "title-row--center" : ""}`} style={style}>
      {center && <span aria-hidden="true" />}
      {children}
      <TitleLogo src={src} color={color} className="title-logo--side" />
    </div>
  );
}
