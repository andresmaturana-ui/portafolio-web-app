"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed")) return setError("Tu email no está confirmado. En Supabase → Authentication → Users, confirma el usuario o créalo con “Auto Confirm User”.");
      if (msg.includes("invalid login")) return setError("Email o contraseña incorrectos (o el usuario no existe en este proyecto de Supabase).");
      return setError(`No se pudo iniciar sesión: ${error.message}`);
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="login">
      <form className="login-box" onSubmit={onSubmit}>
        <img src="/logo.png" alt="Logo" style={{ width: 72, height: 72, borderRadius: "50%", boxShadow: "0 0 0 1px #2a2e35" }} />
        <h1 className="admin-title">Administrador</h1>
        {!isSupabaseConfigured && (
          <div className="notice">Supabase no está configurado todavía. Revisa el README.</div>
        )}
        {error && <div className="notice notice--error" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="btn" type="submit" disabled={loading || !isSupabaseConfigured}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
