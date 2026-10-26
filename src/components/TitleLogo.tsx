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
export function TitleRow({ children, src, color, center = false, size = "lg" }: { children: React.ReactNode; src?: string | null; color?: string | null; center?: boolean; size?: "lg" | "md" | "sm" }) {
  if (!src) return <>{children}</>;
  return (
    <div className={`title-row title-row--${size} ${center ? "title-row--center" : ""}`}>
      {center && <span aria-hidden="true" />}
      {children}
      <TitleLogo src={src} color={color} className="title-logo--side" />
    </div>
  );
}
