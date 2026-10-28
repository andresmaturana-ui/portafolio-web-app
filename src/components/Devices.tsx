// Mockups de dispositivos. Sin imagen muestran una interfaz esquemática.
import { img } from "@/lib/img";

type PhoneProps = {
  image?: string | null;
  className?: string;
  feedClassName?: string;
  alt?: string;
  accent?: boolean;
  /* Animación de la captura dentro del celular */
  scroll?: "vertical" | "horizontal";
  /* Pantallas que pasan de lado cuando scroll es horizontal */
  screens?: string[];
  scrollClassName?: string;
};

export function Phone({ image, className = "", feedClassName = "", alt = "", accent, scroll, screens = [], scrollClassName = "" }: PhoneProps) {
  if (scroll === "horizontal" && screens.length > 1) {
    const n = screens.length;
    return (
      <div className={`phone ${className}`}>
        <div className="screen">
          <div
            className={`screen-strip shot-x ${scrollClassName}`}
            style={{ width: `${n * 100}%`, ["--end" as string]: `${(-(n - 1) / n) * 100}%` }}
          >
            {screens.map((src, i) => (
              <img key={src + i} src={img(src, 828)} alt={i === 0 ? alt : ""} style={{ width: `${100 / n}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`phone ${className}`}>
      <div className="screen">
        {image ? (
          <img className={scroll === "vertical" ? `shot-y ${scrollClassName}` : ""} src={img(image, 828)} alt={alt} />
        ) : (
          <div className={`feed ${feedClassName}`} aria-hidden="true">
            <div className={`tile ${accent ? "tile--accent" : ""}`} style={{ height: 140 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <div className="tile" style={{ flex: 1, height: 70 }} />
              <div className="tile" style={{ flex: 1, height: 70 }} />
            </div>
            <div className="tile" />
            <div className="tile" />
            <div className="tile" />
            <div className="tile" />
          </div>
        )}
      </div>
    </div>
  );
}

type BrowserProps = { image?: string | null; url?: string | null; title?: string; className?: string; siteClassName?: string; alt?: string };

export function Browser({ image, url, title, className = "", siteClassName = "", alt = "" }: BrowserProps) {
  // Sin enlace en el proyecto, la barra muestra su nombre en vez de una dirección inventada.
  const host = url ? safeHost(url) : (title ?? "");
  return (
    <div className={`browser ${className}`}>
      <div className="browser-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="mono" style={{ marginLeft: 12, fontSize: 10 }}>
          {host}
        </span>
      </div>
      <div className="browser-body">
        <div className={siteClassName}>
          {image ? (
            <img className="site-shot" src={img(image, 1200)} alt={alt} />
          ) : (
            <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }} aria-hidden="true">
              <div className="tile" style={{ height: 180 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <div className="tile" style={{ height: 120 }} />
                <div className="tile tile--accent" style={{ height: 120 }} />
                <div className="tile" style={{ height: 120 }} />
              </div>
              <div className="tile" style={{ height: 200 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Tablet({ image, className = "", alt = "" }: { image?: string | null; className?: string; alt?: string }) {
  return (
    <div className={`tablet ${className}`}>
      {image ? (
        <img src={img(image, 1080)} alt={alt} />
      ) : (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }} aria-hidden="true">
          <div className="tile" style={{ height: 110 }} />
          <div className="tile tile--accent" style={{ height: 60 }} />
          <div className="tile" />
          <div className="tile" />
        </div>
      )}
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0];
  }
}
