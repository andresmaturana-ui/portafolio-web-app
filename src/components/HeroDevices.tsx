import { Browser, Phone } from "@/components/Devices";

type Props = {
  apps: string[];
  web?: { image: string | null; url: string | null; title: string };
  design?: string | null;
};

// Portada "Web · App · Diseño": la misma coreografía de las apps del portafolio (el celular central se levanta
// y dos más se abren a los lados), con el navegador de fondo y el afiche de diseño. Cada pieza sale solo si su sección está visible.
export function HeroDevices({ apps, web, design }: Props) {
  const [center, left, right] = [apps[0], apps[1] ?? apps[0], apps[2] ?? apps[1] ?? apps[0]];
  return (
    <div className="hero-devices" aria-hidden="true">
      <div className="gridbg anim k-grid" />
      {web && (
        <div className="hd-back">
          <Browser className="anim k-br" image={web.image} url={web.url} title={web.title} />
        </div>
      )}
      {design !== undefined && (
        <div className="hd hd-design anim k-hd-design">
          <div className="hd-poster">{design ? <img src={design} alt="" /> : <span className="hd-poster-fill">Aa</span>}</div>
          <span className="hd-tag mono">Diseño</span>
        </div>
      )}
      {apps.length > 0 && (
        <>
          <Phone className="anim k-pl" image={left} accent />
          <Phone className="anim k-pr" image={right} />
          <Phone className="anim k-pc" image={center} scroll="vertical" scrollClassName="anim k-shot" />
        </>
      )}
    </div>
  );
}
