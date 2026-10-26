-- Portafolio Andrés Maturana: esquema para Supabase.
-- Se puede correr en un proyecto existente: todo usa el prefijo portfolio_.
-- Supabase → SQL Editor → pegar y ejecutar.

-- 1. Administradores (solo estos emails pueden crear/editar proyectos)
create table if not exists public.portfolio_admins (
  email text primary key
);

create or replace function public.portfolio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portfolio_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

alter table public.portfolio_admins enable row level security;
drop policy if exists "admins se leen a sí mismos" on public.portfolio_admins;
create policy "admins se leen a sí mismos" on public.portfolio_admins
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 2. Proyectos
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('app', 'web', 'diseno', 'foto')),
  summary text not null default '',
  description text not null default '',
  cover_url text,
  gallery text[] not null default '{}',
  link text,
  client text,
  year int,
  featured boolean not null default false,
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plantilla de la página del proyecto (vacía = automática según la categoría)
alter table public.portfolio_projects add column if not exists template text;
alter table public.portfolio_projects add column if not exists scroll text not null default 'vertical';
-- Capturas de la versión escritorio de una app (para mostrar el ecosistema celular + escritorio)
alter table public.portfolio_projects add column if not exists desktop text[] not null default '{}';
-- Imagen de fondo del proyecto en la portada líquida (vacía = su portada)
alter table public.portfolio_projects add column if not exists hero_bg text;
-- Logo del proyecto como sticker (JSON: imagen, tamaño, color y estilo)
alter table public.portfolio_projects add column if not exists sticker text;
-- Logo chico junto al nombre del proyecto
alter table public.portfolio_projects add column if not exists logo text;
alter table public.portfolio_projects add column if not exists logo_color text;
alter table public.portfolio_projects add column if not exists logo_opts text;

create index if not exists portfolio_projects_category_idx
  on public.portfolio_projects (category, sort);

alter table public.portfolio_projects enable row level security;

drop policy if exists "lectura pública de publicados" on public.portfolio_projects;
create policy "lectura pública de publicados" on public.portfolio_projects
  for select using (published or public.portfolio_is_admin());

drop policy if exists "admins escriben" on public.portfolio_projects;
create policy "admins escriben" on public.portfolio_projects
  for all using (public.portfolio_is_admin()) with check (public.portfolio_is_admin());

-- 3. Imágenes: bucket público "portfolio"
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "portfolio lectura pública" on storage.objects;
create policy "portfolio lectura pública" on storage.objects
  for select using (bucket_id = 'portfolio');

drop policy if exists "portfolio admins suben" on storage.objects;
create policy "portfolio admins suben" on storage.objects
  for insert with check (bucket_id = 'portfolio' and public.portfolio_is_admin());

drop policy if exists "portfolio admins editan" on storage.objects;
create policy "portfolio admins editan" on storage.objects
  for update using (bucket_id = 'portfolio' and public.portfolio_is_admin());

drop policy if exists "portfolio admins borran" on storage.objects;
create policy "portfolio admins borran" on storage.objects
  for delete using (bucket_id = 'portfolio' and public.portfolio_is_admin());

-- 4. Agrega tu email como administrador (cámbialo por el tuyo):
-- insert into public.portfolio_admins (email) values ('tu@email.com');

-- Ajustes del sitio: ver supabase/ajustes.sql
