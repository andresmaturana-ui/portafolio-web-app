"use client";

import { useActionState } from "react";
import { sendMessage, type ContactState } from "@/app/contacto/actions";

export function ContactForm({ services }: { services: string[] }) {
  const [state, action, sending] = useActionState<ContactState, FormData>(sendMessage, {});

  if (state.ok) {
    return (
      <div className="contact-form contact-sent" role="status">
        <p className="mono eyebrow">Mensaje enviado ✓</p>
        <p style={{ margin: 0, fontSize: 20 }}>Gracias, te respondo pronto.</p>
      </div>
    );
  }

  return (
    <form action={action} className="contact-form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="c-name">Nombre</label>
          <input className="input" id="c-name" name="name" required maxLength={120} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input className="input" id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Teléfono (opcional)</label>
          <input className="input" id="c-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="c-service">¿Qué necesitas?</label>
          <select className="select" id="c-service" name="service" defaultValue="">
            <option value="">Elige una opción</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-message">Mensaje</label>
        <textarea className="textarea" id="c-message" name="message" required maxLength={4000} placeholder="Cuéntame tu idea, plazos y presupuesto aproximado." />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="trap" />
      {state.error && (
        <div className="notice notice--error" role="alert">
          {state.error}
        </div>
      )}
      <button className="btn" type="submit" disabled={sending} style={{ alignSelf: "flex-start" }}>
        {sending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
