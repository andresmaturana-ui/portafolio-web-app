import { Browser, Phone } from "@/components/Devices";

type Props = {
  web?: { image: string | null; url: string | null; title: string };
  app?: string | null;
  design?: string | null;
  photo?: string | null;
};

// Portada "Web · App · Diseño · Foto": las piezas llegan desde los lados con el scroll y se arman en una composición.
export function HeroDevices({ web, app, design, photo }: Props) {
  return (
    <div className="hero-devices" aria-hidden="true">
      <div className="gridbg anim k-grid" />
      <div className="hd hd-web anim k-hd-web">
        <Browser image={web?.image} url={web?.url} title={web?.title} />
        <span className="hd-tag mono">Web</span>
      </div>
      <div className="hd hd-design anim k-hd-design">
        <div className="hd-poster">{design ? <img src={design} alt="" /> : <span className="hd-poster-fill">Aa</span>}</div>
        <span className="hd-tag mono">Diseño</span>
      </div>
      <div className="hd hd-photo anim k-hd-photo">
        <div className="hd-print">{photo ? <img src={photo} alt="" /> : <span className="hd-print-fill" />}</div>
        <span className="hd-tag mono">Foto</span>
      </div>
      <div className="hd hd-app anim k-hd-app">
        <Phone image={app} className="phone--static" accent />
        <span className="hd-tag mono">App</span>
      </div>
    </div>
  );
}
