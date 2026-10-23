export function NotConfigured() {
  return (
    <div className="notice">
      Supabase todavía no está configurado. Agrega <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> como variables de entorno y corre <code>supabase/schema.sql</code>. Mientras
      tanto el sitio muestra proyectos de ejemplo.
    </div>
  );
}

export function NotAdmin({ email, error }: { email: string | null; error?: string | null }) {
  return (
    <div className="notice notice--error">
      Tu cuenta ({email}) no está en la lista de administradores. En Supabase → SQL Editor ejecuta:{" "}
      <code>insert into portfolio_admins (email) values (&apos;{email}&apos;);</code>
      {error && (
        <>
          <br />
          <br />
          Detalle técnico: {error}
        </>
      )}
    </div>
  );
}
