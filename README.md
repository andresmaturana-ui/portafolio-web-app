# Portafolio Andrés Maturana

Landing de portafolio (apps, web, diseño gráfico y fotografía) con animaciones ligadas al scroll
y un administrador para subir proyectos.

- **Next.js 15** (App Router) + TypeScript
- **Supabase** para login del administrador, base de datos e imágenes
- Animaciones con CSS *scroll-driven animations* (`animation-timeline: view()`): avanzan al bajar y
  retroceden al subir, sin librerías. Funcionan en Chrome, Edge y Safari recientes; en navegadores
  sin soporte el contenido se muestra estático.

## Puesta en marcha

### 1. Supabase (puedes usar un proyecto que ya tengas)

Todo usa el prefijo `portfolio_` y el bucket `portfolio`, así que no choca con otras tablas.

1. Supabase → **SQL Editor** → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
2. Agrega tu email como administrador:
   ```sql
   insert into public.portfolio_admins (email) values ('tu@email.com');
   ```
3. **Authentication → Users → Add user**: crea tu usuario con ese email y una contraseña.
   Solo los emails de `portfolio_admins` pueden crear, editar o borrar proyectos y subir imágenes.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` (o configúralas en Vercel) con los valores de
Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Sin estas variables el sitio funciona igual, mostrando proyectos de ejemplo.

### 3. Desarrollo

```bash
npm install
npm run dev
```

- Sitio: http://localhost:3000
- Administrador: http://localhost:3000/admin

### 4. Publicar

Importa el repo en Vercel, agrega las dos variables de entorno y despliega.

## Cómo se usan las imágenes de cada proyecto

| Categoría | 1ª imagen (portada) | 2ª | 3ª |
|---|---|---|---|
| App | Pantalla del celular central | Celular izquierdo | Celular derecho |
| Web | Captura de escritorio (puede ser larga, se desplaza) | Tablet | Móvil |
| Fotografía | Foto de la cinta horizontal | Resto de la serie en el detalle | |
| Diseño gráfico | Portada de la tarjeta | Resto en el detalle | |

La landing muestra hasta 3 apps y 3 webs como escenas animadas, todas las fotos en la cinta y todos
los proyectos de diseño en la grilla. El campo **Orden** define la posición (menor primero).

## Datos generales

Email de contacto, servicios y enlace a la galería de fotos están en [`src/lib/site.ts`](src/lib/site.ts).
