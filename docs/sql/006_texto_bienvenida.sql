-- Portada · Texto de bienvenida del Inicio (columna izquierda del Hero), editable desde el panel.
-- Guarda: { "titulo", "destacado", "subtexto", "chips": { "peliculas", "series", "top" } }.
-- Vacío (null) = el sitio usa el texto original. Lo que hace cada chip no se guarda: es fijo.
-- Solo agrega una columna. Se puede ejecutar más de una vez sin problema.

alter table public.business_info add column if not exists hero jsonb;
