-- Proyectos iniciales del portafolio. Ejecutar después de schema.sql (SQL Editor).
-- Se puede correr más de una vez: actualiza los proyectos si ya existen.
-- Las imágenes viven en el sitio (carpeta public/proyectos); luego puedes cambiarlas desde /admin.

-- Columna nueva para elegir la plantilla del proyecto (por si corriste schema.sql antes)
alter table public.portfolio_projects add column if not exists template text;

delete from public.portfolio_projects where slug = 'marketplace-de-musica';

insert into public.portfolio_projects
  (slug, title, category, summary, description, cover_url, gallery, link, year, featured, published, sort, template)
values
  ('melomaniac', 'Melomaniac', 'app',
   'Marketplace de música para comprar y vender.',
   '', null, '{}', null, 2026, true, true, 0, null),

  ('kiltrazo', 'Kiltrazo', 'app',
   'Registro de mascotas con reconocimiento facial para que vuelvan a casa si se pierden.',
   E'App (PWA) para registrar mascotas gratis con un escaneo de la cara tipo Face ID.\nSi una mascota se pierde, quien la encuentra la escanea y se avisa al dueño, sin exponer sus datos.\nIncluye avisos de mascota perdida, mapa con cómo llegar, salud y vacunas, reencuentros y panel de administración.',
   '/proyectos/kiltrazo-1.jpg',
   array['/proyectos/kiltrazo-2.jpg','/proyectos/kiltrazo-3.jpg','/proyectos/kiltrazo-4.jpg','/proyectos/kiltrazo-5.jpg'],
   'https://kiltrazo.cl', 2026, true, true, 1, 'app-historia'),

  ('senalizador', 'Señalizador para ciclistas', 'app',
   'El teléfono se vuelve la luz trasera de la bici: giros y freno controlados por voz.',
   E'Di «izquierda», «derecha» o «frenando» y la pantalla muestra la señal en grande.\nModo peligro, botón SOS con ubicación a un contacto de emergencia, GPS que apaga el giro al doblar y guía inicial paso a paso.\nWeb app instalable y apps para iPhone y Android.',
   '/proyectos/senalizador-1.jpg',
   array['/proyectos/senalizador-2.jpg','/proyectos/senalizador-3.jpg'],
   'https://bikeligts.pages.dev', 2026, true, true, 2, 'app-escaparate'),

  ('tagking', 'TagKing', 'app',
   'Tags y grafitis geolocalizados en la ciudad, con ranking de los más grafiteados.',
   E'Cualquiera puede fotografiar un tag en la calle y registrarlo con su ubicación.\nLos artistas reclaman su tag y todos sus grafitis pasan a su perfil, con mapa, feed y su puesto en el ranking.\nLaravel + Leaflet, instalable como app (PWA).',
   '/proyectos/tagking-1.jpg',
   array['/proyectos/tagking-2.jpg','/proyectos/tagking-3.jpg','/proyectos/tagking-4.jpg','/proyectos/tagking-5.jpg'],
   null, 2026, true, true, 3, 'app-escaparate'),

  -- Borrador: se publica cuando tenga capturas (en /admin marca "Publicado").
  ('skatespots', 'Skatespots', 'app',
   'Clips de skate en un mapa de spots, con ranking por likes.',
   E'Mapa de spots con filtro por tipo (escalera, baranda, gap, bowl…), clips de hasta 20 segundos, ranking de la ciudad y por spot, perfil de skater, avisos push y cómo llegar.\nLaravel + Leaflet, instalable como app (PWA).',
   '/proyectos/skatespots-logo.jpg', '{}', null, 2026, false, false, 4, null),

  ('artist', 'ART?ST', 'app',
   '¿Quién es el artista? Arte callejero geolocalizado en la ciudad.',
   E'Murales, stencils y mosaicos a pantalla completa, uno a la vez, con mapa y cómo llegar.\nLos artistas pueden reclamar sus obras; incluye tiendas, galerías, exposiciones y publicidad según intereses.\nLaravel + Leaflet, instalable como app (PWA).',
   '/proyectos/artist-1.jpg',
   array['/proyectos/artist-2.jpg','/proyectos/artist-3.jpg'],
   null, 2026, true, true, 4, 'app-historia')
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  description = excluded.description,
  cover_url = excluded.cover_url,
  gallery = excluded.gallery,
  link = excluded.link,
  year = excluded.year,
  sort = excluded.sort,
  template = excluded.template,
  published = excluded.published,
  updated_at = now();
