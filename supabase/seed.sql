-- Proyectos iniciales. Ejecutar después de schema.sql (SQL Editor).
-- Luego completa descripción, enlaces e imágenes desde /admin.
insert into public.portfolio_projects (slug, title, category, summary, featured, published, sort, year)
values
  ('melomaniac', 'Melomaniac', 'app', 'App para melómanos.', true, true, 0, 2026),
  ('marketplace-de-musica', 'Marketplace de música', 'web', 'Marketplace para comprar y vender música.', true, true, 0, 2026)
on conflict (slug) do nothing;
