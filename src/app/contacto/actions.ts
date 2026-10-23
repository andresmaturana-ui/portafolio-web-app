"use server";

import { MESSAGES_TABLE, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ContactState = { ok?: boolean; error?: string };

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Campo trampa: las personas no lo ven; si viene lleno es un bot.
  if (String(formData.get("website") ?? "")) return { ok: true };
  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const record = {
    name: field("name", 120),
    email: field("email", 200),
    phone: field("phone", 40) || null,
    service: field("service", 80) || null,
    message: field("message", 4000),
  };
  if (!record.name || !record.message) return { error: "Escribe tu nombre y tu mensaje." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return { error: "Revisa tu email, parece que le falta algo." };
  if (!isSupabaseConfigured) return { error: "El formulario aún no está conectado. Escríbeme por email o WhatsApp." };

  const supabase = await createClient();
  const { error } = await supabase.from(MESSAGES_TABLE).insert(record);
  if (error) {
    console.error("No se pudo guardar el mensaje:", error.message);
    return { error: "No se pudo enviar. Prueba de nuevo o escríbeme por email o WhatsApp." };
  }
  return { ok: true };
}
