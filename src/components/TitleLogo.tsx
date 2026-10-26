// Logo chico del proyecto, en la misma línea que su nombre (si tiene).
export function TitleLogo({ src }: { src?: string | null }) {
  if (!src) return null;
  return <img className="title-logo" src={src} alt="" aria-hidden="true" />;
}
