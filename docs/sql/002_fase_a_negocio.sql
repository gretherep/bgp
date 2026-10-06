-- Fase A.6 · Negocio: el horario pasa a ser un campo propio.
-- Antes el Inicio lo sacaba de la descripción con una expresión regular ("HORARIO ...: Lunes a Viernes de 9am a 6pm.").
-- Se puede ejecutar más de una vez sin problema.

alter table public.business_info add column if not exists horario text;

-- Rellena el horario con lo que dice hoy la descripción (solo si todavía está vacío).
update public.business_info
set horario = trim(substring(description from '(?i)HORARIO[^:]*:\s*([^\r\n.]+)'))
where horario is null
  and description ~* 'HORARIO[^:]*:';
