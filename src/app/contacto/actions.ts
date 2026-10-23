"use server";

import { site } from "@/lib/site";
import { MESSAGES_TABLE, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Message = { name: string; email: string; phone: string | null; service: string | null; message: string };

const escape = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Manda el mensaje al correo con la cuenta de Resend de Andrés (RESEND_API_KEY en Vercel).
// Sin dominio propio verificado, Resend solo deja enviar desde onboarding@resend.dev al email de la cuenta.
async function emailMessage(m: Message) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const rows: [string, string][] = [
    ["Nombre", m.name],
    ["Email", m.email],
    ["Teléfono", m.phone ?? "—"],
    ["Servicio", m.service ?? "—"],
  ];
  const html = `<h2>Nuevo mensaje desde tu portafolio</h2>
<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escape(v)}</td></tr>`).join("")}</table>
<p style="white-space:pre-line">${escape(m.message)}</p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Portafolio <onboarding@resend.dev>",
        to: [site.notifyEmail],
        reply_to: m.email,
        subject: `Nuevo mensaje de ${m.name}${m.service ? ` · ${m.service}` : ""}`,
        html,
      }),
      cache: "no-store",
    });
    if (!res.ok) console.error("Resend no envió el correo:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("Resend no respondió:", e);
    return false;
  }
}

export type ContactState = { ok?: boolean; error?: string };

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Campo trampa: las personas no lo ven; si viene lleno es un bot.
  if (String(formData.get("website") ?? "")) return { ok: true };
  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const record: Message = {
    name: field("name", 120),
    email: field("email", 200),
    phone: field("phone", 40) || null,
    service: field("service", 80) || null,
    message: field("message", 4000),
  };
  if (!record.name || !record.message) return { error: "Escribe tu nombre y tu mensaje." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return { error: "Revisa tu email, parece que le falta algo." };

  // Se guarda en Admin → Mensajes y además se manda al correo; basta con que funcione uno de los dos.
  let saved = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.from(MESSAGES_TABLE).insert(record);
    if (error) console.error("No se pudo guardar el mensaje:", error.message);
    saved = !error;
  }
  const mailed = await emailMessage(record);
  if (!saved && !mailed) return { error: "No se pudo enviar. Prueba de nuevo o escríbeme por email o WhatsApp." };
  return { ok: true };
}
