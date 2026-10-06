-- =====================================================================
-- Fase 0 — Inicio que convierte
-- Ejecutar completo en Supabase → SQL Editor. Es idempotente: se puede
-- volver a correr sin romper nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Rating precalculado en media (elimina el N+1 de /api/ratings/avg
--    y el join con todas las filas de ratings)
-- ---------------------------------------------------------------------
alter table media
  add column if not exists rating_avg   numeric(2,1) not null default 0,
  add column if not exists rating_count integer      not null default 0;

create or replace function refresh_media_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid := coalesce(new.media_id, old.media_id);
begin
  update media m
     set rating_avg   = coalesce(s.a, 0),
         rating_count = coalesce(s.c, 0)
    from (select avg(rating)::numeric(2,1) as a, count(*) as c
            from ratings
           where media_id = mid) s
   where m.id = mid;

  -- si un UPDATE cambió el media_id, recalcular también el anterior
  if tg_op = 'UPDATE' and old.media_id is distinct from new.media_id then
    update media m
       set rating_avg   = coalesce(s.a, 0),
           rating_count = coalesce(s.c, 0)
      from (select avg(rating)::numeric(2,1) as a, count(*) as c
              from ratings
             where media_id = old.media_id) s
     where m.id = old.media_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_ratings_refresh on ratings;
create trigger trg_ratings_refresh
after insert or update or delete on ratings
for each row execute function refresh_media_rating();

-- backfill de los ratings existentes
update media m
   set rating_avg   = s.a,
       rating_count = s.c
  from (select media_id, avg(rating)::numeric(2,1) as a, count(*) as c
          from ratings
         group by media_id) s
 where s.media_id = m.id;

-- ---------------------------------------------------------------------
-- 2. Índices para los listados del Inicio
-- ---------------------------------------------------------------------
create index if not exists media_estreno_year_idx on media (estreno desc, year desc);
create index if not exists media_created_idx      on media (created_at desc);
create index if not exists media_rating_idx       on media (rating_avg desc) where rating_count > 0;

-- ---------------------------------------------------------------------
-- 3. Recomendada de la semana (la elige el admin)
-- ---------------------------------------------------------------------
create table if not exists recomendacion (
  id         uuid primary key default gen_random_uuid(),
  media_id   uuid not null references media(id) on delete cascade,
  frase      text not null,
  razones    text[] not null default '{}'
             check (cardinality(razones) <= 3),
  activa     boolean not null default true,
  desde      timestamptz not null default now(),
  hasta      timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- solo una recomendación activa a la vez
create unique index if not exists recomendacion_una_activa
  on recomendacion (activa) where activa;

-- ---------------------------------------------------------------------
-- 4. Promos
-- ---------------------------------------------------------------------
create table if not exists promos (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('strip', 'card')),
  titulo      text not null,
  subtitulo   text,
  badge       text,              -- ej. '-20%', '2x1', 'GRATIS'
  cta_label   text,              -- ej. 'Lo quiero'
  cta_mensaje text,              -- texto prellenado en WhatsApp
  min_items   integer check (min_items is null or min_items > 0),
  desde       timestamptz not null default now(),
  hasta       timestamptz,
  prioridad   integer not null default 0,
  activa      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists promos_activas_idx on promos (kind, prioridad desc) where activa;

-- ---------------------------------------------------------------------
-- 5. Seguridad: las tablas nuevas solo se leen y escriben desde el
--    servidor (service role). Con RLS activo y sin políticas, el cliente
--    anónimo no tiene acceso directo.
-- ---------------------------------------------------------------------
alter table recomendacion enable row level security;
alter table promos        enable row level security;

-- updated_at automático
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_recomendacion_touch on recomendacion;
create trigger trg_recomendacion_touch before update on recomendacion
for each row execute function touch_updated_at();

drop trigger if exists trg_promos_touch on promos;
create trigger trg_promos_touch before update on promos
for each row execute function touch_updated_at();

commit;

-- ---------------------------------------------------------------------
-- Verificación (ejecutar aparte; debe devolver filas coherentes)
-- ---------------------------------------------------------------------
-- select title, rating_avg, rating_count from media where rating_count > 0 order by rating_avg desc limit 10;
-- select count(*) as sin_slug from media where slug is null or slug = '';
