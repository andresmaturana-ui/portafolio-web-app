import Link from "next/link";
import { signOut } from "./actions";

export function AdminHeader() {
  return (
    <header className="site-header">
      <Link href="/admin" className="brand">
        <img src="/marca/logo" alt="" />
        <span className="mono" style={{ color: "var(--text)" }}>Administrador</span>
      </Link>
      <nav className="site-nav" aria-label="Administrador">
        <Link className="mono" href="/admin">Proyectos</Link>
        <Link className="mono" href="/admin/mensajes">Mensajes</Link>
        <Link className="mono" href="/admin/ajustes">Ajustes</Link>
        <Link className="mono" href="/" target="_blank">Ver sitio ↗</Link>
        <form action={signOut}>
          <button className="btn btn--ghost" type="submit" style={{ minHeight: 36, padding: "6px 16px" }}>
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
