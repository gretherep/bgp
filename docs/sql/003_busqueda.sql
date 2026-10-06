-- Búsqueda del sitio (/search): sin importar tildes ni mayúsculas, y tolerante a errores de tipeo.
--   "accion"     → encuentra "Acción"
--   "hary poter" → encuentra "Harry Potter"
-- Se puede ejecutar más de una vez sin problema.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() no es "immutable"; este envoltorio sí, para poder usarlo en búsquedas e índices.
create or replace function public.f_unaccent(text)
returns text
language sql immutable parallel safe strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- Coincidencias primero (empieza por / contiene), después las parecidas (errores de tipeo).
create or replace function public.buscar_media(q text, lim int default 48)
returns setof public.media
language sql stable
set search_path = ''
as $$
  with b as (select lower(public.f_unaccent(trim(q))) as t)
  select m.*
  from public.media m, b
  where length(b.t) >= 2
    and (
      lower(public.f_unaccent(m.title)) like '%' || b.t || '%'
      or extensions.word_similarity(b.t, lower(public.f_unaccent(m.title))) >= 0.5
    )
  order by
    (lower(public.f_unaccent(m.title)) like b.t || '%') desc,
    (lower(public.f_unaccent(m.title)) like '%' || b.t || '%') desc,
    extensions.word_similarity(b.t, lower(public.f_unaccent(m.title))) desc,
    m.estreno desc nulls last,
    m.year desc,
    m.id
  limit greatest(1, least(lim, 100));
$$;
