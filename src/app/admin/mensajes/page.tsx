import { MESSAGES_TABLE } from "@/lib/supabase/config";
import { deleteMessage, markMessage } from "../actions";
import { AdminHeader } from "../AdminHeader";
import { requireUser } from "../guard";
import { NotAdmin, NotConfigured } from "../Notices";

export const dynamic = "force-dynamic";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" });

export default async function MessagesPage() {
  const { supabase, isAdmin, email, adminError } = await requireUser();
  let messages: Message[] = [];
  let loadError: string | null = null;
  if (supabase && isAdmin) {
    const { data, error } = await supabase.from(MESSAGES_TABLE).select("*").order("created_at", { ascending: false }).limit(200);
    messages = (data as Message[]) ?? [];
    loadError = error?.message ?? null;
  }
  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <AdminHeader />
      <main className="admin">
        <div className="admin-top">
          <h1 className="admin-title">Mensajes{unread > 0 && ` (${unread} sin leer)`}</h1>
        </div>
        {!supabase && <NotConfigured />}
        {supabase && !isAdmin && <NotAdmin email={email} error={adminError} />}
        {loadError && (
          <div className="notice notice--error">
            No se pudieron cargar los mensajes. Si aún no lo hiciste, corre supabase/ajustes.sql en el SQL Editor de Supabase. ({loadError})
          </div>
        )}
        {isAdmin && !loadError && messages.length === 0 && <div className="notice">Aún no llegan mensajes del formulario de contacto.</div>}
        <div className="messages">
          {messages.map((m) => (
            <article key={m.id} className={`message ${m.read ? "" : "is-new"}`}>
              <header className="message-head">
                <div>
                  <h3>{m.name}</h3>
                  <span className="mono">
                    {fecha.format(new Date(m.created_at))}
                    {m.service && ` · ${m.service}`}
                  </span>
                </div>
                <div className="admin-actions">
                  <a className="btn" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: tu mensaje en mi portafolio")}`}>
                    Responder
                  </a>
                  <form action={markMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                    <button className="btn btn--ghost" type="submit">
                      {m.read ? "Marcar no leído" : "Marcar leído"}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn--danger" type="submit" aria-label={`Borrar mensaje de ${m.name}`}>
                      Borrar
                    </button>
                  </form>
                </div>
              </header>
              <p className="message-body">{m.message}</p>
              <p className="message-meta">
                <a href={`mailto:${m.email}`}>{m.email}</a>
                {m.phone && (
                  <>
                    {" · "}
                    <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}>{m.phone}</a>
                  </>
                )}
              </p>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
