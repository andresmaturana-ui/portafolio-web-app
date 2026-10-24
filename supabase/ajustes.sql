-- Ajustes del sitio (logo, tipografías y colores) que se editan en /admin/ajustes.
-- Córrelo una vez en Supabase → SQL Editor. Se puede volver a correr sin problema.
create table if not exists public.portfolio_settings (
  id int primary key default 1 check (id = 1),
  logo_url text,
  font_display text,
  font_mono text,
  color_bg text,
  color_text text,
  color_accent text,
  hero_type text,
  hero_media text,
  hero_dir text,
  updated_at timestamptz not null default now()
);

-- Portada (por si la tabla se creó antes de que existieran estas columnas).
alter table public.portfolio_settings add column if not exists hero_type text;
alter table public.portfolio_settings add column if not exists hero_media text;
alter table public.portfolio_settings add column if not exists hero_dir text;

-- Contacto que se muestra en la web (se edita en Ajustes).
alter table public.portfolio_settings add column if not exists contact_email text;
alter table public.portfolio_settings add column if not exists contact_phone text;
-- Orden de las secciones del inicio, p. ej. 'app,web,foto,diseno'.
alter table public.portfolio_settings add column if not exists section_order text;

alter table public.portfolio_settings enable row level security;

drop policy if exists "ajustes lectura pública" on public.portfolio_settings;
create policy "ajustes lectura pública" on public.portfolio_settings
  for select using (true);

drop policy if exists "ajustes admins escriben" on public.portfolio_settings;
create policy "ajustes admins escriben" on public.portfolio_settings
  for all using (public.portfolio_is_admin()) with check (public.portfolio_is_admin());

-- Mensajes del formulario de contacto: cualquiera puede escribir, solo los admins leen.
create table if not exists public.portfolio_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.portfolio_messages enable row level security;

drop policy if exists "mensajes cualquiera escribe" on public.portfolio_messages;
create policy "mensajes cualquiera escribe" on public.portfolio_messages
  for insert with check (
    not read
    and char_length(name) between 1 and 120
    and char_length(email) between 3 and 200
    and char_length(coalesce(phone, '')) <= 40
    and char_length(coalesce(service, '')) <= 80
    and char_length(message) between 1 and 4000
  );

drop policy if exists "mensajes admins leen" on public.portfolio_messages;
create policy "mensajes admins leen" on public.portfolio_messages
  for select using (public.portfolio_is_admin());

drop policy if exists "mensajes admins editan" on public.portfolio_messages;
create policy "mensajes admins editan" on public.portfolio_messages
  for update using (public.portfolio_is_admin()) with check (public.portfolio_is_admin());

drop policy if exists "mensajes admins borran" on public.portfolio_messages;
create policy "mensajes admins borran" on public.portfolio_messages
  for delete using (public.portfolio_is_admin());

-- Capturas de la versión escritorio de una app (para mostrar el ecosistema celular + escritorio).
-- No cambia los proyectos que ya subiste.
alter table public.portfolio_projects add column if not exists desktop text[] not null default '{}';
