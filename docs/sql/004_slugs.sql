-- Enlace propio para cada título: /titulo/<slug>  (ej. /titulo/harry-potter-and-the-goblet-of-fire-4)
-- 1) Genera el slug de los títulos que no lo tienen (hoy, todos).
-- 2) Los títulos nuevos lo reciben solos al guardarse.
-- Requiere 003_busqueda.sql (usa public.f_unaccent). Se puede ejecutar más de una vez sin problema.
-- El slug NO cambia si después se corrige el título: así los enlaces ya compartidos siguen funcionando.

create or replace function public.slugify(t text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select trim(both '-' from left(regexp_replace(lower(public.f_unaccent(coalesce(t, ''))), '[^a-z0-9]+', '-', 'g'), 80))
$$;

-- Títulos con el mismo nombre ("It" 1990 y 2017): se les agrega el año; si aun así chocan, 6 letras del id.
with b as (
  select id, year, coalesce(nullif(public.slugify(title), ''), 'titulo') as s
  from public.media
  where slug is null or slug = ''
),
c as (
  select id, case when count(*) over (partition by s) > 1
                    or exists (select 1 from public.media x where x.slug = b.s)
               then s || '-' || coalesce(year::text, left(id::text, 6)) else s end as s2
  from b
),
d as (
  select id, case when count(*) over (partition by s2) > 1
                    or exists (select 1 from public.media x where x.slug = c.s2)
               then s2 || '-' || left(id::text, 6) else s2 end as s3
  from c
)
update public.media m set slug = d.s3
from d
where d.id = m.id;

create unique index if not exists media_slug_unico on public.media (slug);

create or replace function public.media_poner_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
  cand text;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := coalesce(nullif(public.slugify(new.title), ''), 'titulo');
  cand := base;
  if exists (select 1 from public.media where slug = cand and id <> new.id) then
    cand := base || '-' || coalesce(new.year::text, left(new.id::text, 6));
    if exists (select 1 from public.media where slug = cand and id <> new.id) then
      cand := base || '-' || left(new.id::text, 6);
    end if;
  end if;
  new.slug := cand;
  return new;
end
$$;

drop trigger if exists media_poner_slug on public.media;
create trigger media_poner_slug
  before insert or update on public.media
  for each row execute function public.media_poner_slug();
