-- Fase 3 · Pósters livianos: versiones por tamaño y color de fondo.
--   poster_thumb_url  320×480 WebP (~14 KB)  tarjetas en el móvil
--   poster_md_url     480×720 WebP (~25 KB)  tarjetas en PC y pantallas nítidas
--   poster_full_url   900 px de alto (~35 KB) ficha del título
--   poster_color      color medio del póster ("rgb(78,61,44)"): fondo mientras carga la imagen
-- poster_url (el original) no se toca: es el respaldo si un título no tiene versiones.
-- Solo agrega columnas. Se puede ejecutar más de una vez sin problema.

alter table public.media add column if not exists poster_thumb_url text;
alter table public.media add column if not exists poster_md_url text;
alter table public.media add column if not exists poster_full_url text;
alter table public.media add column if not exists poster_color text;
