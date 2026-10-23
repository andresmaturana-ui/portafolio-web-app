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

alter table public.portfolio_settings enable row level security;

drop policy if exists "ajustes lectura pública" on public.portfolio_settings;
create policy "ajustes lectura pública" on public.portfolio_settings
  for select using (true);

drop policy if exists "ajustes admins escriben" on public.portfolio_settings;
create policy "ajustes admins escriben" on public.portfolio_settings
  for all using (public.portfolio_is_admin()) with check (public.portfolio_is_admin());
