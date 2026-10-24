import { Browser, Phone } from "@/components/Devices";

type Props = {
  apps: string[];
  web?: { image: string | null; url: string | null; title: string };
  design?: string | null;
};

// Portada "Web · App · Diseño": un anillo de celulares gira en 3D con el scroll, con el navegador y el afiche a los lados.
// Cada pieza aparece solo si su sección está encendida.
export function HeroDevices({ apps, web, design }: Props) {
  // El anillo necesita al menos 6 celulares; si hay menos capturas se repiten.
  const count = apps.length ? Math.max(6, apps.length) : 0;
  const screens = Array.from({ length: Math.min(count, 10) }, (_, i) => apps[i % apps.length]);
  return (
    <div className="hero-devices" aria-hidden="true">
      <div className="gridbg anim k-grid" />
      {web && (
        <div className="hd hd-web anim k-hd-web">
          <Browser image={web.image} url={web.url} title={web.title} />
          <span className="hd-tag mono">Web</span>
        </div>
      )}
      {design !== undefined && (
        <div className="hd hd-design anim k-hd-design">
          <div className="hd-poster">{design ? <img src={design} alt="" /> : <span className="hd-poster-fill">Aa</span>}</div>
          <span className="hd-tag mono">Diseño</span>
        </div>
      )}
      {screens.length > 0 && (
        <div className="hd-orbit anim k-hd-orbit">
          <div className="hd-base" />
          <div className="hd-ring anim k-hd-spin" style={{ ["--n" as string]: screens.length }}>
            {screens.map((src, i) => (
              <div key={i} className="hd-slot" style={{ ["--i" as string]: i }}>
                <Phone image={src} className="phone--static" accent={i % 3 === 0} />
              </div>
            ))}
          </div>
          <span className="hd-tag mono hd-tag--app">App</span>
        </div>
      )}
    </div>
  );
}
