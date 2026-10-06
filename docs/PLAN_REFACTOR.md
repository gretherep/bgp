# Plan de refactorización — BGP Paquete

> Objetivo: catálogo rápido y barato en datos para móviles en Cuba (3G/LTE inestable), **perfecto también en PC/tablet**, y orientado a convertir visitas en pedidos por WhatsApp.
>
> Orden de las fases: **Fase 0 (Inicio) y Fase A (panel administrativo) primero, por prioridad del negocio**; después, de la más compleja a la menos compleja. Ese orden coincide además con las dependencias técnicas: cada fase se apoya en la anterior.

---

## Diagnóstico de partida (medido en producción, 2026-10-01)

### Rendimiento
| Métrica | Valor actual |
|---|---|
| HTML inicial `/` | 5.6 KB (shell vacío: `layout.tsx` es `"use client"`, todo se pinta por JS) |
| JS + CSS de la home | 335 KB brotli, 17 archivos |
| `/api/media?limit=0` | 188 KB brotli / 671 KB crudos, 879 títulos con sinopsis, ~3 s, `max-age=0`, siempre `MISS` en CDN |
| Pósters | ~104 KB promedio (295 JPG sin comprimir, hasta 183 KB), `Cache-Control: no-cache` |
| Peticiones de rating | 1 `/api/ratings/avg` **por tarjeta** (~20–30 por página) aunque `avg_rating` ya viene en el JSON |
| Animación de fondo | 233 nodos animados con `filter: blur()` en bucle infinito (`ShootingStars`) |
| **Primera visita estimada** | **≈ 3.5 MB y ~35 peticiones** |

### Responsive (medido con viewport emulado)
| Ancho | Problema |
|---|---|
| **375 px (móvil)** | El primer póster del catálogo aparece en **y = 1224 px** (1.5 pantallas de scroll). El hero ocupa 477 px sin ninguna acción posible. Menú hamburguesa + fila de chips duplican la navegación. |
| **768 px (tablet vertical)** | La barra de navegación desktop se activa (`md:`) pero mide **899 px**: se desborda. |
| **1024 px (tablet horizontal / laptop pequeño)** | Se activa el sidebar de filtros (`lg:`, 288 px fijos) y las tarjetas quedan en **106 px de ancho** (5 columnas): ilegibles. |
| **1440 px** | Grid de 5 columnas con tarjetas de 160 px; el sidebar de filtros ocupa ~22 % del ancho útil todo el tiempo. |
| **1920 px** | Contenedor `max-w-7xl` (1280 px): **640 px vacíos** a los lados y tarjetas de solo **160 px**. Hero con `h1` de 72 px y 463 px de alto sin contenido. |
| Todos | Efectos `hover` (escala, elevación) también se disparan en táctil; no hay estados de foco para teclado; el modal es el mismo en móvil y PC. |

### Bugs detectados
1. `MediaModal` montado **dos veces** (`MediaModalContext.tsx:35` y `app/page.tsx:109`): doble `pushState` (hay que pulsar "atrás" dos veces), doble fetch.
2. **Tope de 1000 filas de Supabase**: `getAllMedia` sin `range` → con 879 títulos, a los ~121 títulos más la home empieza a perder contenido en silencio.
3. Edición de media (`admin/media/[id]/edit/page.tsx:116`) **no comprime** el póster.
4. `Navbar` usa `<a href>` y la búsqueda `window.location.href` → recarga completa de la app en cada navegación.
5. `category/[category]` muestra `LoadingBike` a pantalla completa hasta tener el JSON entero.
6. `apiClient` llama a `supabase.auth.getSession()` en **cada GET público** (arrastra supabase-js al bundle público).

> **Recomendación fuera de orden (opcional, ~1 h):** los bugs 1, 2 y el N+1 de ratings son baratos y el 2 es una bomba de tiempo. Si la Fase 1 va a tardar semanas, conviene aplicarlos antes como contención (ver Fase 6, tareas 6.1–6.3).

---

## Breakpoints de referencia (aplican a todas las fases)

| Nombre | Rango | Dispositivo típico | Navegación | Filtros | Columnas del grid |
|---|---|---|---|---|---|
| `xs` | < 640 | Móvil | Header 56 px + **Bottom Nav** | Bottom sheet | 2 (3 en ≥ 400 px apaisado) |
| `sm` | 640–767 | Móvil grande / apaisado | Header + Bottom Nav | Bottom sheet | 3 |
| `md` | 768–1023 | Tablet | Header con búsqueda + fila de chips de categorías (sin Bottom Nav) | Bottom sheet / popover | 4 |
| `lg` | 1024–1279 | Laptop pequeño / tablet horizontal | Header completo | **Barra horizontal** de filtros con popovers | 5 |
| `xl` | 1280–1535 | Laptop / PC | Header completo | Barra horizontal o sidebar colapsable | 6 |
| `2xl` | ≥ 1536 | PC grande | Header completo | Sidebar colapsable | 7–8 |

Reglas:
- Grid con **`grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 30vw, 200px), 1fr))`**: una tarjeta nunca baja de 140 px ni se dispersa en pantallas enormes.
- Contenedor `max-w-[1600px]` con `px-4 sm:px-6 lg:px-10`, no `max-w-7xl`.
- Efectos hover solo en `@media (hover: hover)` (Tailwind: variante `hover:` + `future.hoverOnlyWhenSupported: true`).
- `:focus-visible` visible en todo elemento interactivo; navegación por teclado en carruseles y modal.
- **Matriz de pruebas obligatoria** al cerrar cada fase: 360×740, 390×844, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080.

---

## Leyenda de estado

- ✅ terminada · 🔄 en curso · ⬜ pendiente
- Una tarea de las Fases 1–6 marcada **(→ F0)** se hace en la Fase 0, solo para el Inicio; se marca ✅ en su fase cuando quede hecha para **todo** el sitio.

---

## FASE 0 — Inicio que convierte *(prioridad del negocio)* ✅ *(la edición desde el admin se completó con la Fase A)*

**Objetivo:** que el Inicio sea el destino de los enlaces del **grupo de WhatsApp** y convierta la visita en un mensaje al **50623401** (`wa.me/5350623401`). Toma de las Fases 1, 2 y 5 solo lo que necesita el Inicio, de punta a punta: datos, diseño responsive y enganche.
**Estimación:** 6–8 días. **Depende de:** nada.

**Contexto del negocio (de `business_info` y `pricing_categories`):**
- Paquete semanal de **1 TB**, sin número de edición. Básico: 500 CUP. Horario: lunes a viernes, de 9 am a 6 pm.
- Precios por título: película 50 CUP (80 para quien no es cliente fijo), temporada de serie o anime 100 CUP, capítulo de novela o reality 8 CUP.
- Zona: Pueblo Nuevo, San Luis, Calle Medio, Parque Maceo, Jaiba, Reparto Camilo, Playa y alrededores.
- Canal: **solo un grupo de WhatsApp**. Telegram no se usa (`telegram_url` hoy es un placeholder): ocultarlo.
- La **recomendada de la semana la elige el admin**.
- Paleta sin cambios (`#F9C3A4`, `#161616`, `#DCDAD9`, `#95999E`). Se añaden solo el verde WhatsApp `#25D366` en los CTA de pedido y el rojo ya usado en "Estreno" para las ofertas.

### 0.1 Base de datos ✅ *(`docs/sql/001_fase0_inicio.sql`, ejecutado en Supabase el 2026-10-01)*
- ✅ `media.rating_avg` + `media.rating_count` con trigger sobre `ratings` y backfill *(adelanta 1.1)*.
- ✅ Índices `(estreno desc, year desc)`, `(created_at desc)`, `(rating_avg desc) where rating_count > 0` *(adelanta 1.1)*.
- ✅ Tabla `recomendacion`: `media_id`, `frase` (gancho), `razones text[]` (máx. 3), `activa`, `desde`, `hasta`. Solo una activa a la vez.
- ✅ Tabla `promos`: `kind (strip|card)`, `titulo`, `subtitulo`, `badge` (ej. "-20%"), `cta_label`, `cta_mensaje` (texto que se prellena en WhatsApp), `desde`, `hasta`, `prioridad`, `activa`, `min_items` (opcional, activa la barra de progreso de "Mi pedido") *(adelanta 5.1)*.
- El tamaño del paquete ("1 TB") queda como constante en `src/lib/site.ts`: es fijo y también lo usa la imagen de vista previa.
- ⚠️ Hallazgos de la verificación: los **879 títulos no tienen `slug`** (hay que generarlos antes de la tarea 1.5) y casi todos los ratings tienen **1 solo voto**, así que un "Top por rating" no es representativo todavía.

### 0.2 Layout y metadatos para compartir en WhatsApp ✅
- ✅ `app/layout.tsx` como Server Component; providers, Navbar, login y popups pasan a `components/AppShell.tsx` (cliente), que oculta el Navbar público en `/admin` *(adelanta 1.3)*.
- ✅ `metadata` global: `<title>`, descripción y **Open Graph / Twitter**, más `app/opengraph-image.tsx` (1200×630, composición centrada para el recorte cuadrado de WhatsApp, generada en el build). Datos fijos en `src/lib/site.ts`.
- ✅ Tokens de color en `:root` (`src/styles/globals.css`) y en `tailwind.config.js` (hex literales, para que sigan funcionando las opacidades), `hoverOnlyWhenSupported`, `:focus-visible`, `prefers-reduced-motion` y las utilidades `no-scrollbar`/`scrollbar-hide`, que se usaban pero nunca se habían definido *(adelanta 2.1)*.

### 0.3 Datos del Inicio en servidor ✅ *(el `range()` de `services/media.ts` es de Categoría y Búsqueda: pasa a la Fase 1)*
- 🔄 `src/lib/catalog.ts` (`server-only`): `getHomeData()` → ✅ nuevos de la semana (`created_at` de los últimos 7 días; si hay menos de 4, los últimos agregados), ✅ recomendada activa (si no hay, respaldo con el estreno más reciente y razones sacadas de los datos), ✅ promos activas, ✅ WhatsApp y horario del negocio · ✅ precios activos (`src/lib/precios.ts` relaciona la categoría del título con su tarifa) · ✅ top 10 y primera página del catálogo, en `src/lib/catalogQuery.ts` (`getTopValorados`, `getCatalogo`) *(adelanta 1.2)*.
- ✅ `src/lib/categories.ts` (compartido entre cliente y servidor): categorías navegables (Series incluye MiniSeries; Animados, películas y series animadas; Anime, también Películas Anime), **12 grupos de géneros** que buscan por fragmento (`media.genre` es texto libre con más de 300 combinaciones, como "Terror-Misterio" o "CienciaFicción"), años por década, órdenes, y lectura/escritura de filtros en la URL validando valores.
- ✅ `idiomaLegible()`: convierte el texto libre de `media.idioma` ("Dual-Audio", "Inglés-Subtitulado", "Latino"…) en frases como "Audio en español latino" o "Subtitulada al español".
- ✅ `src/lib/whatsapp.ts`: `waLink(base, texto)` a partir de `business_info.whatsapp_url`, con respaldo a `wa.me/5350623401` y espacios codificados como `%20`.
- ✅ `src/lib/format.ts`: cuenta regresiva, rango de la semana (hora de Cuba), resumen por categoría.
- ✅ Promos de ejemplo **solo en desarrollo** cuando la tabla `promos` está vacía, marcadas con la etiqueta "Ejemplo".
- ✅ `/api/catalog?cat=&anio=&g=&orden=&page=` (y `solo=total` para el conteo en vivo, sin traer pósters), paginado de 24 en 24 con `range()` y cacheado en la CDN (`s-maxage=300, stale-while-revalidate=86400`). Los estrenos van primero por defecto, con desempate por `id` para que la paginación no repita títulos *(adelanta 1.2 / 1.4)*.
- ⬜ `range()` obligatorio también en `services/media.ts` (tope de 1000 filas), que siguen usando Categoría y Búsqueda *(= 6.3)*.
- ⚠️ Dato a limpiar desde el admin: algunos títulos empiezan con espacios (" Beso dinamita…") y se ordenan primero en A–Z.

### 0.4 Secciones del Inicio (responsive en móvil, tablet y PC) ✅
`app/page.tsx` es Server Component con `revalidate = 300`. Orden: franja → hero → ofertas → "¿Qué quieres ver hoy?" → Top 10 → catálogo → "Pídelo". El catálogo viejo (`HomeCatalogLegacy`, con Swiper, framer-motion y sidebar) ya no existe.

Orden en móvil, de arriba abajo:
1. ✅ **`PromoStrip`**: franja cerrable bajo el header, con la promo `strip` de mayor prioridad; en móvil puede ocupar 2 líneas para no cortar el precio.
2. ✅ **`HomeHero`**: "📦 Paquete de esta semana · 1 TB" + rango de la semana, número de títulos nuevos, resumen por categoría, CTA **Pedir el paquete** (WhatsApp) + **Ver precios**, y fila de confianza (domicilio, horario, WhatsApp). En PC va en 2 columnas **de igual altura** (`items-stretch`; mitad y mitad entre 1024 y 1279 px, 1.1/1 desde 1280 px); la fila de novedades se apoya en el borde inferior de su columna.
3. ✅ **`NuevosRail`** sobre **`Carousel`**: scroll-snap horizontal y flechas Anterior/Siguiente discretas en la cabecera de la fila (no tapan pósters ni cambian el alto). Solo aparecen en dispositivos con puntero, se desactivan en cada extremo y avanzan de póster en póster, para evitar el rebote de Chrome entre `scrollBy` suave y `snap-mandatory`.
4. 🔄 **`RecomendadaCard`**: ✅ ocupa toda la altura de la columna, con el bloque póster + info **centrado en vertical** (el espacio sobrante se reparte arriba y abajo) y un **pie** "📦 Incluida en el paquete semanal de 1 TB · 💬 Te respondemos por WhatsApp" · ✅ póster más grande (150 px en 1024, 210 px en 1280–1399 y 250 px desde 1400; 176 px en tablet) · ✅ badge de calificación real "⭐ 4.5 / 5 · N votos" (escala de 5, igual que la ficha), y si no hay votos, "🔥 Estreno" o "✨ Nuevo en el catálogo" · ✅ chips (año, categoría, géneros) · ✅ 3 razones (las del admin o, de respaldo, sacadas de los datos: estreno, temporadas, idioma legible) · ✅ precio suelto según `pricing_categories` ("Desde 100 CUP por temporada") · ✅ **Pídela ya** + **Ver ficha** justo debajo del contenido (no al fondo: dejaba un hueco de 97 px) · ✅ **＋ Al pedido** (0.5).
5. ✅ **`MoodChips`**: "¿Qué quieres ver hoy?" 😂 Para reír · 💥 Acción · 😱 Para pasar miedo · 🔍 Suspenso · 💕 Romance · 👨‍👩‍👧 En familia · 🚀 Ciencia ficción · 🎭 Drama. Cada chip filtra el catálogo de abajo (evento `bgp:filtrar`) y baja hasta él.
6. ✅ **`Top10Row`** "🏆 Top 10 mejor valorados": carrusel con scroll-snap y flechas en PC, tarjetas 2:3 `rounded-xl` con `border-white/10`, número grande en `#F9C3A4` abajo a la izquierda, calificación y cinta "Estreno". Ordena por promedio y luego por cantidad de votos. Se oculta si hay menos de 5 títulos votados. *(Se llama "mejor valorados" y no "lo más visto" porque el sitio no registra vistas; podrá pasar a "Lo más pedido" con la medición de la 5.5.)*
7. ✅ **`OffersRow`**: promos `card` con badge, cuenta regresiva en texto si tienen `hasta`, y CTA a WhatsApp con mensaje propio; scroll-snap en móvil y 3 columnas en PC. Va justo después del hero (antes del Top 10), para que la oferta se vea sin mucho scroll.
8. ✅ **`CatalogoInicio`** *(adelanta 2.3 / 2.4 solo en el Inicio)*:
   - **Sin sidebar.** En PC, barra horizontal con desplegables tipo chip: [Categorías ▾] [Año ▾] [Géneros ▾] [Ordenar por ▾], y al lado los chips de filtros activos, cada uno con ×, más "Limpiar todo".
   - **En móvil y tablet**, un solo botón "🎛️ Filtros (n)" fijo al hacer scroll, que abre una **hoja inferior** con conteo en vivo ("Ver 31 títulos"). El botón "atrás" de Android la cierra.
   - **Grid a todo el ancho**: `repeat(auto-fill, minmax(clamp(140px, 11.5vw, 172px), 1fr))`, que da 2 columnas en móvil, 4 en tablet, 6 en 1024, 7 en 1280–1440 y 8 en 1920.
   - **"Cargar más"** de 24 en 24, con skeletons.
   - **Filtros en la URL**, para compartir enlaces.
   - **Sin resultados**, muestra un CTA "Pedir por WhatsApp".
   - **`PosterCard`**: tarjeta liviana sin framer-motion, con la cinta diagonal **ESTRENO** rojo/naranja, categoría, año y votos reales. Por defecto los estrenos van primero.
9. ✅ **`PideloBlock`**: "¿No encuentras lo que buscas?" con CTA "Pídelo por WhatsApp" y el mensaje ya escrito.
- ✅ Quitar `ShootingStars`, Swiper y framer-motion **del Inicio**: no queda ninguno. Todo es CSS/Tailwind, y las únicas islas de JS son botones, carruseles, filtros y franja.
- ✅ **Menú superior** (`Navbar.tsx`, en todo el sitio público), con la misma paleta *(adelanta 2.2; la barra inferior de navegación móvil sigue en la Fase 2)*:
  - **Arreglos de lo que fallaba:** ya no se desborda en 768 ni en 1024 px; el logo bajó a 40 px (antes 80 × 79, salía de la barra de 64 px); "Descripción y Precios" pasa a **"Precios"**.
  - **Enlaces:** usan `<Link>` (antes `<a>` recargaba la app entera) y la búsqueda usa `router.push` *(= 6.6)*. Las secciones salen de `CATEGORIAS` y el subrayado marca la activa.
  - **≥ 1280 px:** todo en línea, campo de búsqueda fijo, botón verde **"Pedir"** (WhatsApp) y usuario.
  - **1024–1279 px:** las 8 secciones en línea y la búsqueda como ícono que despliega el campo a todo el ancho.
  - **< 1024 px:** logo, búsqueda (ícono), WhatsApp, usuario (desde 640 px) y **☰ panel lateral** con las secciones, "Escríbenos por WhatsApp" e inicio/cierre de sesión. "Atrás" y Esc lo cierran (`useHojaModal`), y al navegar desde el panel no queda ninguna entrada huérfana en el historial.
  - Verificado: sin desborde en 360, 640, 768, 1024, 1280, 1440 y 1920 px, y sin recargas de página al abrir y cerrar paneles (Next marca esas entradas del historial como propias).
- ✅ `MediaCard` sin `useMediaRating` (usa el `avg_rating` / `rating_avg` que ya trae el listado; también beneficia a Categoría y Búsqueda) y sin `MediaModal` duplicado en el Inicio *(= 6.1, 6.2)*.
- ✅ Skeletons: ~~`loading.tsx` del Inicio~~ **descartado tras probarlo**. El `Suspense` que crea `loading.tsx` dejaba la hidratación del contenido en baja prioridad: en una pestaña en segundo plano nunca se hidrataba (botones ＋, filtros y ficha sin responder), y sin él se hidrata al instante. Como el Inicio es estático y el HTML ya llega con todo el contenido, el skeleton de ruta solo aportaba al volver desde otra página. Quedan los skeletons del catálogo (al filtrar y en "Cargar más"). Para las páginas dinámicas de la Fase 1, probar `loading.tsx` con la pestaña visible y oculta antes de adoptarlo.
- ✅ Carga diferida verificada en producción: de entrada solo se descargan el logo, 4 pósters de novedades y el de la recomendada. El catálogo y el Top 10 cargan al acercarse.
- ✅ **JS inicial de 307 KB a 206 KB gzip (−33 %)**, que se reparte en todo el sitio:
  - **La ficha** (`MediaModal`, con auth y votos) se carga **solo al abrir un título** y ya no usa framer-motion. Además se cierra con "atrás", Esc, ✕ o clic fuera sin dejar entradas en el historial, cosa que antes sí pasaba.
  - **El login y los popups** se cargan al abrirse.
  - **Supabase** se carga solo si hay una sesión guardada (cookie `sb-…-auth-token`) o al tocar "Iniciar sesión".
- ✅ Corregido en "Mi pedido": dos toques ＋ muy seguidos perdían un título, porque cada botón partía de la lista de su último render. Ahora siempre se parte de la lista guardada.

### 0.5 "Mi pedido" ✅
- ✅ `src/lib/pedido.ts`: `usePedido()` con `useSyncExternalStore` + `localStorage` (`bgp:pedido`), sincronizado entre pestañas y entre todos los botones de la página. Sin cuenta ni servidor; el pedido se conserva al recargar.
- ✅ `PedidoToggle` (＋ / ✓): en las tarjetas del catálogo, del Top 10 y de las novedades (esquina del póster, fuera del botón de la ficha para no anidar botones), en la recomendada ("＋ Al pedido" / "✓ En tu pedido") y en la **ficha** (`MediaModal`), junto a "Pedir por WhatsApp".
- ✅ `PedidoFlotante` (montado en `AppShell`, en todo el sitio público): botón **🛍️ Mi pedido (n)** abajo a la derecha, visible solo si hay títulos, con aviso "✓ Añadido: …" al sumar.
- ✅ `PedidoPanel`: hoja inferior en móvil y panel lateral derecho desde 640 px. "Atrás" y Esc cierran, y el scroll de fondo se bloquea (`src/hooks/useHojaModal.ts`, compartido con la hoja de filtros).
  - **Lista**: póster, año, categoría, precio y quitar.
  - **Total aproximado** según `pricing_categories` (`precioItem()`): películas por unidad, series y anime × temporadas; novelas y realities se cobran por capítulo y no suman.
  - **"Enviar pedido por WhatsApp"**: lista numerada + total + promo alcanzada.
  - **"Vaciar pedido"**, con confirmación.
- ✅ Barra de progreso de la promo activa con `min_items`: "Te faltan 3 títulos para la promo" → "🎉 ¡Ya tienes la promo!". Cuenta todos los títulos del pedido.
- ✅ `/api/pedido-config`: tarifas, WhatsApp y promo con mínimo de títulos. Cacheada en la CDN y pedida una sola vez por visita, al abrir el panel.

### 0.6 Admin → movida a la **Fase A** (rediseño completo del panel)
Los editores de la recomendada y de las promos, y la revalidación al guardar, ahora son las tareas A.3, A.4 y A.5. Mientras tanto, si hace falta publicar antes, se puede cargar una promo o una recomendada desde el Table Editor de Supabase.

### 0.7 Verificación ✅ *(2026-10-03, build de producción en una copia aparte)*
- ✅ Build de producción sin errores; el Inicio es estático y se regenera cada 5 minutos (`○ /  5m`). Todas las rutas públicas responden 200 (Inicio, Categorías, Búsqueda, Precios, admin, APIs, imagen OG).
- ✅ Matriz de resoluciones, todas sin scroll horizontal y sin desborde del menú:

  | Ancho | Columnas del catálogo | Ancho de tarjeta |
  |---|---|---|
  | 360 | 2 | 158 px |
  | 390 | 2 | 173 px |
  | 768 | 4 | 164 px |
  | 1024 | 6 | 142 px |
  | 1366 | 7 | 168 px |
  | 1440 | 7 | 178 px |
  | 1920 | 8 | 176 px |

- ✅ En todos los anchos, el hero, el CTA de WhatsApp (termina entre 358 y 427 px) y la fila de novedades (empieza entre 466 y 585 px) quedan en la primera pantalla.
- ✅ Vista previa del enlace: `<title>`, Open Graph e imagen 1200×630 en producción, con `og:image` apuntando a `https://paquete-bgp.vercel.app/opengraph-image`. ⬜ Falta probarla pegando el enlace real en WhatsApp después del deploy.
- ✅ 0 llamadas a `/api/ratings/avg` y a `/api/media` en el Inicio. El HTML trae el contenido real (46 títulos) en 31 KB gzip.
- ✅ Recorrido funcional en producción: hidratación completa, ficha (abre, cierra, carga bajo demanda), ＋ pedido, panel con total, filtros (Terror → 118) con URL compartible, menú con "atrás", búsqueda sin recargar, y 0 errores en consola.
- **Peso estimado de la primera visita en móvil:** HTML 31 KB + JS/CSS 206 KB + ~5 pósters (~100 KB c/u hasta las miniaturas de la Fase 3) ≈ **0,75 MB** (antes ≈ 3,5 MB).

**Criterios de aceptación de la Fase 0**
- ✅ Desde cualquier punto del Inicio, como máximo **2 toques** hasta WhatsApp con un mensaje prellenado.
- ⬜ Recomendada y promos cambian desde el admin sin redeploy *(depende de la Fase A)*.
- ✅ Primera visita al Inicio en móvil < 1 MB (≈ 0,75 MB, sin las miniaturas de la Fase 3), sin el JSON de 671 KB.

---

## FASE A — Panel administrativo (rediseño completo) ✅ *(2026-10-06)*

**Objetivo:** un panel **sencillo**, con la **misma identidad visual que la web** (paleta, tipografía, bordes, botones), desde el que la administradora edite **todo lo que ve el cliente**, empezando por lo nuevo del Inicio: la recomendada y las promos.
**Estimación:** 7–9 días. **Riesgo:** medio (hay que reescribir todas las páginas del admin). **Depende de:** Fase 0 (tablas `recomendacion` y `promos`, componentes del Inicio).

**Principios**
- **Un solo sistema de diseño** para la web y el admin: tokens de la 0.2 (`primary`, `surface`, `whatsapp`, `offer`…) y componentes compartidos en `src/components/ui/`. Fuera los grises, el índigo y el azul actuales.
- **Lo que editas es lo que ves:** cada editor muestra la vista previa con **los mismos componentes del sitio** (`RecomendadaCard`, `OffersRow`, `PromoStrip`), en modo móvil y PC.
- **Pensado para el teléfono:** el panel se usa cómodo desde el móvil (navegación inferior), no solo desde la PC.
- **Lenguaje simple**, sin jerga técnica: "Franja de arriba", "Tarjeta de oferta", "Se ve hasta el domingo".
- **Cada guardado se refleja en el sitio al momento** (revalidación), sin redeploy.

### A.1 Base del panel ✅ *(revisada con sesión de admin el 2026-10-05)*
- ✅ Componentes UI compartidos en `src/components/ui/`: `Button`/`ButtonLink` (primario, WhatsApp, secundario, fantasma, peligro), `Field` (etiqueta, ayuda, error, contador), `Input`, `Textarea`, `Select`, `Switch`, `Badge` (éxito, aviso, neutro, peligro, marca), `Card`/`CardHeader`, `PageHeader`, `EmptyState` y `ConfirmDialog` (que se cierra con "atrás" y Esc). Las fechas usan `<input type="date">` nativo y los helpers de `components/admin/fechas.ts`.
- ✅ `AdminShell`: sidebar fijo en PC (logo, secciones, "Ver sitio", cerrar sesión, nombre de la sesión), cabecera compacta y **barra inferior en móvil/tablet** (Resumen · Portada · Catálogo · Precios · Más, donde "Más" abre una hoja con Negocio, Usuarios y Cerrar sesión). Usa la misma paleta que la web.
- ✅ Protección en servidor, en dos capas:
  - **`src/proxy.ts`** (solo `/admin/*`): renueva la sesión de Supabase en cookies (el token dura 1 h y un Server Component no puede refrescarlo) y redirige al inicio si no hay sesión.
  - **Layout del admin**: ahora es Server Component y verifica el rol `admin` con `getAdmin()` (`src/lib/adminAuth.ts`) antes de enviar nada al navegador.

  Probado: sin sesión, y con una cookie falsa, todas las rutas del panel devuelven 307 al inicio. `/admin` redirige a `/admin/dashboard`.
- Para guardar se usan **Server Actions** con `requireAdminAction()` en lugar de nuevas APIs con token: igual de seguro, menos código y permite `revalidatePath("/")` en la misma acción.
- ✅ **Corregido `createRequestClient`** (`utils/supabaseRequest.ts`, ya existía): usaba la API de cookies `get/set/remove`, deprecada en `@supabase/ssr` 0.8, que no lee la sesión cuando la cookie se guarda con prefijo `base64-` (el formato que escribe la renovación). Efectos: el panel echaba a la admin después de la primera renovación, y en un Route Handler llegó a **borrar la cookie de sesión**. Pasa a `getAll/setAll`. También arregla `requireAdminAction`, que usaban las acciones viejas (por ejemplo, guardar los datos del negocio). Verificado: sesión estable en recargas seguidas de `/admin/*`.
- ✅ Contenido del panel a `max-w-6xl`, para que las vistas previas tengan el mismo ancho que en el Inicio.

### A.2 Nueva estructura de navegación ✅
- ✅ **Resumen** (`/admin/dashboard`, Server Component, sin `recharts` ni la API `/api/admin/dashboard`, que se eliminó):
  - saludo con el nombre de la admin;
  - accesos rápidos: Cambiar recomendada, Nueva promo (va directo a `#promociones`) y Agregar título;
  - **"Lo que ve hoy el cliente"**: recomendada (elegida o automática, con póster y fecha), franja de arriba y ofertas activas, más las programadas;
  - **"Para revisar"**, con ícono + texto + acción: recomendada sin elegir o vencida, promos que terminan en menos de 48 h, vencidas que siguen publicadas, sin promos activas, títulos sin póster y títulos con espacios de más al inicio o al final (ya corregidos: 0);
  - **indicadores** (stat tiles, números en color de texto): títulos y estrenos marcados, nuevos de la semana, usuarios y votos (total y de los últimos 7 días).

  Verificado con sesión real en 375 y 1440 px, sin desbordes. El cálculo con la hora actual va en `cargarResumen()`, fuera del render (regla de pureza de React).
| Sección | Qué se hace ahí | Reemplaza a |
|---|---|---|
| **Resumen** | Qué está viendo hoy el cliente: recomendada activa, promos activas y por vencer, títulos nuevos de la semana. Accesos rápidos: "Cambiar recomendada", "Nueva promo", "Agregar título". | Dashboard con gráficas (`recharts` sale del bundle) |
| **Portada** | Recomendada de la semana + Promociones (A.3, A.4) | *(nuevo)* |
| **Catálogo** | Títulos: lista, búsqueda, filtros, alta/edición | Media |
| **Precios** | Tarifas por categoría, orden por arrastre | Precios |
| **Negocio** | Nombre, logo, descripción, WhatsApp, horario | Descripción |
| **Usuarios** | Perfiles y roles | Perfiles |

### A.3 Editor de la recomendada (Portada) ✅ *(revisado sin publicar; falta el acceso desde Catálogo)*
Correcciones de la revisión:
- **Resultados viejos durante la búsqueda:** la lista se vacía y muestra "Buscando…", para que no se elija un resultado de la búsqueda anterior.
- **Errores visibles:** un error de la acción se muestra como tal, no como "No hay títulos".
- **Géneros con guion:** "Comedia-Drama" se separa (también "Sci-fi" → Ciencia ficción) y la sugerencia dice "Ideal si te gusta: comedia y drama".
- **Fecha "Hasta" en domingo:** si hoy es domingo, por defecto queda el domingo siguiente (antes la recomendada duraba solo ese día).
- **Columnas en móvil:** con `min-w-0`, un título largo ya no desborda la tarjeta.
- **Vista previa en PC:** columna más ancha (578 px, como en el Inicio), y debajo del formulario por debajo de 1280 px.
Página `/admin/portada` → `RecomendadaEditor`.
- ✅ Estado arriba: Publicada, Desde…, Vencida o Automática, con título y fecha de fin.
- ✅ Buscador de títulos con póster (debounce de 300 ms, Server Action `buscarTitulos`). Sin escribir nada, muestra lo último que entró.
- ✅ Frase gancho con contador (ideal 140, máximo 200) y un ejemplo en la ayuda.
- ✅ 3 razones, con **sugerencias de un clic** (`razonesSugeridas()` en `lib/format.ts`, compartida con la tarjeta de respaldo).
- ✅ Vigencia: por defecto de **hoy al domingo**, editable; "Hasta" vacío significa sin fin.
- ✅ **Vista previa en vivo con la misma `RecomendadaCard` del Inicio**, que se actualiza mientras se escribe. Se ve como en el dispositivo desde el que se edita.
- ✅ "Publicar en el Inicio" (desactiva la anterior y crea la nueva) y "Quitar recomendada" con confirmación (el Inicio vuelve a la destacada automática).
- ✅ Historial de las 10 anteriores con "Reutilizar", que carga título, frase y razones con vigencia de esta semana.
- ✅ Acceso directo "⭐ Recomendar esta semana" desde la lista y el formulario del Catálogo (`?recomendar=<id>`).

### A.4 Editor de promociones (Portada) ✅ *(revisado sin guardar: plantillas, vista previa de tarjeta y franja, cancelar)*
`PromosEditor` + `PromoForm`.
- ✅ **Lista**:
  - estado (Activa, Programada, Vencida, Pausada), tipo (Franja/Tarjeta) e indicador "● En el sitio" para la franja que se está mostrando;
  - mínimo de títulos y vigencia de cada una;
  - **interruptor** para pausar o activar (cambio optimista que se revierte si falla);
  - editar, duplicar (sale pausada, como "(copia)") y borrar con confirmación (que sugiere pausar en su lugar).
- ✅ **Prioridad por arrastre** con `@dnd-kit` (asa de arrastre, funciona con dedo y con teclado); el orden se guarda al soltar.
- ✅ **Formulario** en panel lateral (hoja inferior en móvil):
  - plantillas rápidas (📦 Paquete de la semana, 🏷️ Descuento, 🎁 Combo, ✌️ 2x1, 🔎 A pedido);
  - tipo explicado con un dibujo mínimo (**Franja de arriba** / **Tarjeta de oferta**);
  - etiqueta, título y detalle con contador; texto del botón; **mensaje que llega a tu WhatsApp**;
  - desde/hasta (por defecto, hasta el domingo); mínimo de títulos; "Publicada".
- ✅ Vista previa en vivo con los mismos `PromoStrip` y `OfertaCard` del Inicio (`OfertaCard` se separó de `OffersRow` para esto), con la cuenta regresiva.

### A.5 Guardado y revalidación ✅
- ✅ Server Actions en `app/admin/portada/actions.ts`, todas con `requireAdminAction()` y validación de largo, fechas y existencia del título, devolviendo errores en lenguaje simple: `buscarTitulos`, `publicarRecomendacion`, `quitarRecomendacion`, `guardarPromo` (crear o editar), `cambiarActivaPromo`, `borrarPromo` y `reordenarPromos`.
- ✅ `revalidatePath("/")` y `"/admin/portada"` en cada guardado de recomendada y promos: el Inicio se actualiza sin redeploy.
- ✅ Lo mismo al guardar títulos, precios y datos del negocio (con la A.6) *(adelanta 1.6)*.

### A.6 Rediseño de las secciones existentes ✅
- ✅ **Catálogo** *(revisado con sesión real, sin guardar cambios; falta probar un guardado real)*:
  - **Lista** (`/admin/media`, Server Component): póster, título, año, categoría, temporadas e idioma; búsqueda con espera de 400 ms, filtro por categoría y "🔥 Solo estrenos" (todo en la URL); 20 por página. **Interruptor de "Estreno"** en cada fila (optimista); acciones ⭐ Recomendar, editar y borrar con confirmación. "Sin póster" marcado en rojo.
  - **Aviso "N títulos tienen espacios de más"** con botón **"Corregir ahora"** (`corregirEspaciosEnTitulos`: recorta inicio, final y espacios dobles). El Resumen usa el mismo criterio. ✅ **Ejecutado con permiso de la dueña (2026-10-05): 128 títulos corregidos, hoy quedan 0** (sin choques de nombres). En el primer intento, 128 updates simultáneos hicieron fallar algunos por red; ahora va en tandas de 10 y avisa cuántos faltan.
  - **Un solo formulario** (`MediaForm`) para alta y edición (`new` y `[id]/edit` ya no duplican código):
    - póster subido y **siempre comprimido** a WebP (~200 KB, máx. 900 px), también al editar *(= 6.5)*; también acepta una URL https; el archivo se carga bajo demanda;
    - campos: categoría, año, idioma (con sugerencias de los valores reales), temporadas (solo en categorías de series), géneros con chips que no duplican, estreno y sinopsis con contador;
    - vista previa con la misma `PosterCard` del sitio (no interactiva);
    - "Recomendar esta semana" y "Borrar título" (zona de peligro);
    - al volver, se conservan filtros y página.
  - **Server Actions** (`app/admin/media/actions.ts`): `guardarTitulo` (valida categoría, año, género, sinopsis y URL https; normaliza espacios), `subirPoster` (máx. 900 KB, nombre UUID, `cacheControl` de 1 año), `cambiarEstreno`, `borrarTitulo` (votos y recomendaciones caen en cascada) y `corregirEspaciosEnTitulos`. Todas revalidan `/`, `/admin/media` y `/admin/dashboard`.
  - **⭐ Recomendar esta semana** → `/admin/portada?recomendar=<id>`: el editor abre con ese título, la frase vacía con el cursor en ella y la vigencia de esta semana *(cierra el pendiente de la A.3)*.
  - "Películas Anime" agregada a `MEDIA_CATEGORIES` (la base la acepta y hay 2 títulos así; antes no se podían elegir).
- ✅ **Precios** (`/admin/pricing-categories`, Server Component + `PreciosEditor`) *(revisado con sesión real sin guardar; 375 px sin desbordes)*:
  - una tarjeta por tarifa: precio **editable en línea** (Enter guarda), moneda (CUP/USD/MLC), unidad ("c/u", "por temporada", "por capítulo") y **"El cliente ve: Desde 50 CUP c/u"** en vivo;
  - "También cobra: …" (p. ej. Películas cobra también Películas Animadas y Películas Anime), sacado de `TARIFAS` en `lib/precios.ts`, la misma tabla que usa el sitio;
  - "Sin guardar" + Guardar/Deshacer solo cuando hay cambios; interruptor **Visible** (optimista) que no pisa un precio a medio editar;
  - texto de la página de Precios plegable, con **aviso si el precio cambió y el texto todavía dice el viejo** ("Una Película 50CUP…");
  - **orden por arrastre** (`@dnd-kit`, dedo y teclado); "Agregar tarifa" solo si falta alguna de las 5; borrar con confirmación (sugiere ocultar).
  - Server Actions en `app/admin/pricing-categories/actions.ts`: `guardarPrecio`, `cambiarActivoPrecio`, `reordenarPrecios`, `borrarPrecio`; revalidan `/`, `/descripcion`, `/admin/pricing-categories` y `/admin/portada`.
  - Se eliminaron las páginas viejas `new/` y `[id]/` y las acciones/servicios de escritura sin uso de `pricingCategory.actions.ts` (solo queda la lectura pública).
- ✅ **Negocio** (`/admin/descripcion`, Server Component + `NegocioForm`) *(revisado con sesión real sin guardar; 375 px sin desbordes)*:
  - **WhatsApp como número** (+53 y 8 dígitos, validado como móvil cubano) en lugar de una URL; se guarda como `https://wa.me/53…`; enlace "Probar".
  - **Horario como campo propio**: columna `business_info.horario` (`docs/sql/002_fase_a_negocio.sql`, la rellena con lo que dice hoy la descripción). ✅ SQL ejecutado (2026-10-05): el campo está activo con "Lunes a Viernes de 9am a 6pm". Mientras no exista la columna, el campo sale desactivado con el aviso, y el Inicio sigue sacándolo de la descripción (`horarioDe()` en `lib/catalog.ts`, con `select("*")` para no romperse).
  - Título, logo (comprimido a WebP de 512 px, nombre UUID, se publica al Guardar) y descripción con contador.
  - Vista previa "Así se ve en el Inicio" (botón Pedir y fila de confianza con el horario); barra fija "Cambios sin guardar" con Deshacer/Guardar, encima de la barra inferior en móvil.
  - **Telegram y los precios viejos** (`price_basic/standard/premium`, vacíos) ya no se muestran ni se editan.
  - Server Actions `guardarNegocio` y `subirLogo` (`app/admin/descripcion/actions.ts`); revalidan `/`, `/descripcion`, `/admin/descripcion` y `/admin/portada`. Se eliminaron `actions/business.actions.ts` y el `PATCH` de `/api/descripcion` (queda solo la lectura pública).
- ✅ **Usuarios** (`/admin/profiles`, Server Component + `UsuariosLista`) *(revisado con sesión real sin guardar; 375 px sin desbordes)*:
  - lista con inicial, nombre, correo, fecha de alta y nº de votos; etiquetas Admin/Cliente y "Tú";
  - búsqueda por nombre o correo (espera de 400 ms) y filtro Todos/Admins/Clientes con cantidades, todo en la URL;
  - **Editar** en panel lateral (hoja en móvil): nombre, apellido, rol (con aviso al hacer admin a alguien) y contraseña nueva opcional (mín. 8);
  - **protecciones** en el servidor: nadie puede quitarse su propio rol de admin ni borrar su propia cuenta (el panel nunca se queda sin admin);
  - borrar cuenta (Auth + perfil) con confirmación;
  - Server Actions `guardarUsuario` y `borrarUsuario` (`app/admin/profiles/actions.ts`).
  - Se eliminaron "Crear usuario" (los clientes se registran solos), las páginas `new/` y `[id]/edit/`, `actions/profile.actions.ts` y los `GET/PATCH/DELETE` de `/api/users` (queda el `POST` del perfil propio que usa `useAuth`).
  - Nota: en Auth hay 5 cuentas viejas (nov–dic 2025) sin perfil, que no salen en la lista.

### A.7 Verificación ✅ *(2026-10-06)*
- ✅ El panel completo usable en 360 px, 768 px y 1440 px: las 7 pantallas (Resumen, Portada, Catálogo, Agregar título, Precios, Negocio, Usuarios) sin scroll horizontal en los tres anchos.
- ✅ Un usuario sin rol `admin` no llega a ver el panel (ni un instante): sin sesión y con cookie falsa, las 8 rutas de `/admin` responden 307 al Inicio desde el `proxy`; con sesión de cliente, el layout (Server Component) redirige antes de renderizar, y cada Server Action vuelve a exigir `requireAdminAction()`.
- ✅ Guardar se ve en el Inicio de inmediato: probado por la dueña en todas las secciones.
- ✅ `tsc` sin errores; lint sin errores en todos los archivos tocados (quedan 18 archivos viejos con `any` y variables sin usar, para las Fases 1 y 6); `next build` de producción sin errores (Inicio estático con revalidación de 5 min).
- ✅ "Cerrar sesión" pasa a `signOut({ scope: "local" })` en el sitio y en el panel: antes cerraba la sesión en **todos los dispositivos** (salir en el teléfono echaba también a la PC).

**Criterios de aceptación de la Fase A**
- Ningún color ni componente del admin fuera del sistema de diseño de la web.
- Cambiar la recomendada o crear una promo: **≤ 1 minuto**, desde el teléfono.

---

## FASE 1 — Arquitectura de datos y renderizado *(la más compleja)*

**Objetivo:** pasar de "SPA que descarga todo el catálogo" a páginas renderizadas en servidor, cacheadas en CDN, con datos mínimos y paginados.
**Estimación:** 5–7 días. **Riesgo:** alto (toca todas las rutas públicas). **Depende de:** nada.

### 1.1 Migraciones SQL (Supabase)
- [ ] Columnas precalculadas en `media`: `rating_avg numeric(2,1)`, `rating_count int` + **trigger** sobre `ratings` (insert/update/delete) + backfill.
- [ ] Columnas para imágenes (usadas en Fase 3): `poster_thumb_url text`, `poster_md_url text`, `poster_color text`.
- [ ] Índices: `(category, estreno desc, year desc)`, `(created_at desc)`, `(rating_avg desc) where rating_count > 0`.
- [ ] Búsqueda: extensiones `unaccent` + `pg_trgm`, índice GIN trigram sobre `unaccent(title)`; función RPC `search_media(q text, lim int, off int)`.
- [ ] Géneros: hoy son texto libre (`"Acción, Drama"`) y se filtran con `split` en el cliente. Migrar a `genres text[]` con índice GIN (mantener `genre` mientras dure la transición).
- [ ] Categorías: mover el mapeo slug → categoría (`peliculas` → `Películas`, etc.) de `services/media.ts` a una sola constante compartida (`src/lib/categories.ts`) usada por servidor, rutas y navegación.

### 1.2 Capa de datos server-only
- [ ] `src/lib/catalog.ts` con `import "server-only"`: `getHomeData()`, `getCategoryPage(slug, {page, year, genres})`, `getMediaBySlug(slug)`, `searchMedia(q, page)`, `getActivePromos()`.
- [ ] Selección **solo de campos de tarjeta** (`id, slug, title, year, category, genres, estreno, poster_thumb_url, poster_md_url, poster_color, rating_avg, rating_count`). La sinopsis solo en `getMediaBySlug`.
- [ ] Paginación siempre con `range()`, 24 ítems por página (divisible entre 2, 3, 4, 6, 8 columnas → filas completas en todos los breakpoints).
- [ ] Reescribir `/api/media` GET para usar esta capa y devolver `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`. Igual en `/api/descripcion` y `/api/pricing-categories`.

### 1.3 Layout y grupos de rutas
- [ ] Crear grupos `app/(public)/` y `app/(admin)/admin/` con layouts separados → el admin (recharts, dnd-kit, browser-image-compression) nunca toca el bundle público.
- [ ] `app/layout.tsx` como **Server Component** (sin `"use client"`), tokens de color en `:root` de `globals.css` (hoy repetidos inline en `layout.tsx` y `descripcion/page.tsx`).
- [ ] `app/(public)/providers.tsx` (cliente) con `ToastProvider` y estado mínimo. Eliminar `MediaModalProvider` (lo reemplaza 1.5).
- [ ] `metadata` y `viewport` exportados (título, descripción, `themeColor`, `manifest`).

### 1.4 Páginas públicas en servidor + ISR
- [ ] **Inicio** (`(public)/page.tsx`): Server Component, `export const revalidate = 300`. Renderiza hero, carruseles y la **primera página** del catálogo en el HTML.
- ✅ **Categoría** (`category/[category]/page.tsx`, 2026-10-06): Server Component con `generateStaticParams` (6 slugs), `dynamicParams = false` (otra categoría → 404) y `revalidate = 300`; primera página en el HTML. Rediseño:
  - cabecera con ruta (Inicio › Películas), título con emoji, qué incluye, **nº de títulos y precio** ("Desde 60 CUP c/u"; Animados muestra sus dos tarifas) y **"Pedir una película"** por WhatsApp;
  - chips para saltar a otra categoría;
  - "🆕 Lo último en…" y "🏆 Mejor valorados en…" (`getTopValorados(10, categorias)`), solo si la categoría no cabe en una página (Reality, 15 títulos, muestra solo el catálogo);
  - el **mismo catálogo del Inicio** (`CatalogoInicio` → `Catalogo`, con `catFija` y `ruta`): sin el filtro de categoría, filtros en la URL de la categoría (`/category/series?g=drama`), hoja de filtros en móvil sin la sección Categoría;
  - "¿No encuentras lo que buscas?" al final.
  - Verificado: 74 películas de terror (118 en todo el catálogo), 121 series de drama, 360–1440 px sin scroll horizontal, 4/6/7 columnas en 768/1024/1440.
  - Se eliminaron `FilterSidebar`, `MultiSelect`, `SingleSelect`, `LoadingBike` y `utils/filter-options.ts` (sin uso).
- [ ] **Filtros y "Cargar más"**: componente cliente `CatalogGrid` que recibe `initialItems` y pide páginas siguientes / filtros a `/api/catalog?cat=&year=&genres=&page=` (respuesta cacheada en CDN). Estado de filtros **en la URL** también en Inicio (hoy solo en Categoría).
- [ ] **Búsqueda** (`/search?q=`): Server Component dinámico usando la RPC de 1.1; navegación con `router.push`, no `window.location`.
- [ ] `loading.tsx` por ruta con skeletons del tamaño exacto de las tarjetas (reemplaza `LoadingBike`).
- [ ] `not-found.tsx` para categorías / títulos inexistentes.

### 1.5 Página de título compartible + modal interceptado
- [ ] `(public)/titulo/[slug]/page.tsx`: página completa (póster, sinopsis, rating, CTA de pedido) con `generateMetadata` → **Open Graph** con póster: al pegar el link en WhatsApp sale la tarjeta con imagen.
- [ ] `(public)/@modal/(.)titulo/[slug]/page.tsx`: **intercepting route** → al tocar una tarjeta dentro del sitio se abre como modal (URL real, botón "atrás" nativo, sin `pushState` manual); al abrir el link directo se ve la página completa.
- [ ] Verificar `slug` único y no nulo en los 879 registros; generar los que falten.

**Hecho (2026-10-06), sin intercepting route:**
- ✅ **`/titulo/[slug]`**: Server Component con ISR bajo demanda (`generateStaticParams` vacío + `revalidate = 300`; el panel la revalida al guardar títulos, precios o negocio). `generateMetadata` con **Open Graph del póster** (`video.movie`), canonical y **JSON-LD** (`Movie`/`TVSeries` + `aggregateRating`). Fondo con el póster difuminado, ruta Inicio › Categoría › Título y **"Si te gustó, mira también"** (`getParecidos`: misma categoría y grupo de género).
- ✅ Acepta también el **id** (`/titulo/<uuid>`) y redirige (308) a la dirección con nombre: los enlaces funcionan antes y después del SQL 004.
- ✅ **`FichaTitulo`** (un solo componente para la ventanita y la página): póster con ESTRENO, categoría (enlace) · año · temporadas, calificación guardada (sin pedir `/api/ratings/avg`), géneros, idioma legible, sinopsis, **precio** (`precioItem`, config compartida con "Mi pedido" vía `usePedidoConfig`), **Pedir por WhatsApp con el enlace de la ficha**, ＋ Mi pedido, **Compartir** (menú del teléfono o copiar enlace) y estrellas para votar (`Votar`, cargado aparte porque trae Supabase; sin sesión abre el login con `EVENTO_ABRIR_LOGIN`).
- ✅ **`MediaModal`** rehecho con el sistema de diseño (hoja desde abajo en móvil, ventana en PC) usando `FichaTitulo` + "Ver la ficha completa →".
- ✅ Las tarjetas (`OpenMedia`) son `<a href="/titulo/…">`: toque normal → ventanita; Ctrl/⌘+clic, clic central y buscadores → página.
- ✅ **`docs/sql/004_slugs.sql`**: `slugify()` (sin tildes, máx. 80), relleno de los 880 (choques: "It", "S.W.A.T." y "La maldición de Hill House" llevan el año, y si aún chocan, 6 letras del id), índice único y trigger que pone el slug a los títulos nuevos sin cambiarlo al editar. ⬜ **Falta ejecutar el SQL 004.**
- ✅ Se eliminaron `useMediaRating` y `/api/ratings/avg`.
- ⬜ Intercepting route (`@modal/(.)titulo`) para que la ventanita tenga URL propia: queda para después; hoy la ventanita se cierra con "atrás" y comparte el enlace de la página.

### 1.6 Revalidación bajo demanda
- 🔄 Las Server Actions del panel (Catálogo, Precios, Negocio) revalidan `/`, `/category/[category]` y `/descripcion` ✅; falta `/titulo/[slug]` cuando exista (1.5).

### 1.7 Auth fuera del bundle público
- [ ] `apiClient`: solo adjunta token en mutaciones; los GET públicos no tocan Supabase.
- [ ] Carga perezosa (`import()`) de supabase-js al abrir el login o al votar. El estado "logueado" para el ícono del header se lee de una cookie ligera.

**Criterios de aceptación Fase 1**
- `view-source` de `/` contiene los títulos y URLs de pósters de la primera página.
- `/api/media` y páginas responden con `x-vercel-cache: HIT` en la segunda petición.
- 0 llamadas a `/api/ratings/avg` al cargar listados.
- Ninguna respuesta pública > 30 KB brotli.
- Admin funciona igual que antes (crear/editar/borrar refleja cambios en ≤ 5 s).

---

## FASE 2 — Rediseño UI responsive (móvil, tablet y PC)

**Objetivo:** una interfaz que se sienta app nativa en móvil y catálogo de streaming en PC, sin los fallos de la tabla de diagnóstico.
**Estimación:** 5–6 días. **Riesgo:** medio. **Depende de:** Fase 1 (componentes en servidor, rutas de título).

### 2.1 Sistema de diseño
- [ ] Tokens en `tailwind.config.js`: colores (`primary #F9C3A4`, `surface`, `surface-2`, `text`, `muted`, `whatsapp #25D366`), radios (tarjeta `xl`, botón `lg`), sombras, escala tipográfica con `clamp()` (el `h1` hoy salta de 36 a 72 px).
- [ ] Contenedor común `<Container>` (`max-w-[1600px]`, gutters por breakpoint).
- [ ] `future.hoverOnlyWhenSupported: true` y estilos `focus-visible` globales.
- [ ] Fondo del hero: degradados CSS estáticos (sustituye `ShootingStars`; en PC puede quedar una versión CSS ligera respetando `prefers-reduced-motion`).

### 2.2 Navegación
| Breakpoint | Diseño |
|---|---|
| < 768 | Header 56 px: logo · búsqueda (ícono que expande) · login. **Bottom Nav fija**: Inicio · Categorías · Buscar · Mi pedido (badge) · Precios, con `env(safe-area-inset-bottom)`. Sin hamburguesa. |
| 768–1023 | Header: logo · **campo de búsqueda visible** · Mi pedido · login. Debajo, **fila de chips de categorías** con scroll horizontal (resuelve el desborde de 899 px). Sin Bottom Nav. |
| ≥ 1024 | Header único: logo · categorías (con "Más ▾" si no caben) · búsqueda con sugerencias · botón **WhatsApp** · Mi pedido · login. Header se compacta (de 72 a 56 px) al hacer scroll. |

- [ ] Todos los enlaces con `<Link>` + estado activo por `usePathname`.
- [ ] Página `/categorias` (destino del tab móvil) con tarjetas grandes por categoría y conteo.

### 2.3 Filtros
| Breakpoint | Diseño |
|---|---|
| < 1024 | Botón "Filtros (n)" → **bottom sheet** `max-h-[80vh]`: años como chips (`2026 · 2025 · 2024 · 2010s · 2000s · Clásicos`), géneros como chips, botón **"Ver 124 títulos"** con conteo en vivo. |
| 1024–1535 | **Barra horizontal** sobre el grid: `Año ▾` `Géneros ▾` `Orden ▾` como popovers + chips de filtros activos. El grid usa el 100 % del ancho (soluciona las tarjetas de 106 px). |
| ≥ 1536 | Opción de **sidebar colapsable** (240 px, recordado en `localStorage`), por defecto colapsado. |

- [ ] Fila de **chips de filtros activos** removibles sobre el grid en todos los tamaños.
- [ ] Orden: "Estrenos primero" (actual), "Recién agregados", "Mejor valorados", "A–Z".
- ✅ Reemplazar `FilterSidebar` + `MultiSelect` + `SingleSelect` por `FilterSheet` + chips desplegables (`FiltroPopover`) dentro de `Catalogo`, con la URL como fuente de verdad (Inicio y Categoría).

### 2.4 Tarjeta y grid
- [ ] `MediaCard` como Server Component (sin hooks): póster (Fase 3), badge estreno, año, categoría, título 2 líneas, `⭐ 4.6 · 128`. Botón `＋ pedido` (isla cliente pequeña).
- [ ] PC: hover revela overlay con géneros y botones "Ver" / "＋ Pedido"; móvil: sin overlay, toque abre el título.
- [ ] Grid `auto-fill` (ver breakpoints); quitar `motion.div layout` + `AnimatePresence` del grid.
- [ ] `content-visibility: auto` por bloque de 24 ítems.
- [ ] Inserción de tarjeta de promo cada N ítems (Fase 5) sin romper filas.

### 2.5 Carruseles (Top 10, Estrenos de la semana, Recién agregados)
- [ ] Componente único `PosterRow` con **CSS scroll-snap** (sin Swiper).
- [ ] Móvil: swipe, 2.3–3.3 tarjetas visibles (asomo de la siguiente).
- [ ] PC: **flechas prev/next** en hover, scroll por página visible, soporte de teclado, 6–8 tarjetas visibles; ranking numérico grande estilo "Top 10" en `lg+`.

### 2.6 Detalle del título (modal / página)
| Breakpoint | Diseño |
|---|---|
| < 768 | Hoja a pantalla completa con póster arriba (40 vh), info y **CTA fijo abajo** ("Encargar por WhatsApp" + "＋ Mi pedido"). |
| ≥ 768 | Diálogo centrado `max-w-4xl`, 2 columnas (póster 1/3, info 2/3), cierre con Esc y clic fuera, foco atrapado. Fila de "Títulos similares" (misma categoría/género). |

### 2.7 Hero de Inicio responsive
| Breakpoint | Diseño |
|---|---|
| < 768 | Compacto (≤ 55 % del viewport): badge del paquete, titular 24–28 px, resumen por categoría, CTA WhatsApp + Precios, y la fila de estrenos **inmediatamente debajo**. El catálogo debe empezar antes de y = 700 px. |
| ≥ 1024 | **2 columnas**: izquierda texto + CTAs; derecha **mosaico** de 6 pósters de estreno en abanico. Alto máx. 420 px. |

### 2.8 Páginas secundarias
- ✅ `/descripcion` → **Precios** (2026-10-06): Server Component estático (`revalidate = 300`; lo revalidan Precios y Negocio del panel) con `getPreciosPagina()`. Antes: cliente con `ShootingStars` + framer-motion y dos fetch a la API.
  - **Paquete semanal** destacado ("Lo más pedido"): 1 TB, precio sacado de la descripción (`precioPaqueteDe`: "PRECIO DEL PAQUETE…: 500CUP"), horario del campo propio y "Reservar turno"; en PC es sticky junto a las tarifas.
  - **Títulos por separado**: una tarjeta por tarifa en el orden del panel, con precio, unidad, **ejemplo de cuenta** ("3 temporadas = 300 CUP"), "También: …", el texto de la tarifa y enlace a su categoría.
  - **Ofertas activas** (las mismas tarjetas del Inicio).
  - **"Tu Dosis Semanal…"**: la descripción del panel ordenada por `seccionesNegocio()` (las líneas "ETIQUETA: texto" se ven como tarjetas: Turnos del día, Ojo, Domicilio…; precio y horario no se repiten).
  - Cierre "¿Dudas con algún precio?" por WhatsApp. Telegram fuera. Sin barra fija en móvil: chocaría con el botón flotante de "Mi pedido".
  - Verificado 360–1440 px sin scroll horizontal; 28 KB gzip en desarrollo.
  - Se eliminaron `ShootingStars`, `/api/descripcion`, `/api/pricing-categories`, `actions/pricingCategory.actions.ts`, `services/pricingCategories.ts` y los modelos `pricingCategory`/`businessInfo` (sin uso).
- ✅ `/search` → **Búsqueda** (2026-10-06): Server Component dinámico (`?query=`, también `?q=`), `noindex`.
  - **Búsqueda en vivo** (`BuscadorEnVivo`): al escribir (pausa de 350 ms, mín. 2 letras) cambia la URL y el servidor devuelve los resultados; Enter busca y cierra el teclado del teléfono; si llega otra búsqueda desde el menú, el campo la refleja.
  - Resultados con `PosterCard` en la misma cuadrícula del catálogo (`GRID_POSTERS`, compartida), hasta 48.
  - **Sin resultados**: "No tenemos «…» en el catálogo" + **"Pedir «…»" por WhatsApp con el nombre buscado** + "Quizás te interese" (lo último que entró). Sin búsqueda: chips de categorías y lo último que entró.
  - `buscarCatalogo()` usa la RPC `buscar_media` (**`docs/sql/003_busqueda.sql`**: `unaccent` + `pg_trgm`, sin tildes y tolerante a errores: "hary poter" → Harry Potter). ⬜ **Falta ejecutar el SQL 003.** Mientras tanto, ilike con cada vocal como comodín ("accion" ya encuentra "Acción").
  - Se eliminaron `/api/media` (y `/api/media/poster`), `services/media.ts`, `actions/media.actions.ts`, `actions/ratings.actions.ts` y `MediaCard` (sin uso).
- ✅ Tamaños reales en producción (transferidos, comprimidos): Inicio 30 KB, Películas 27 KB, Reality 13 KB, Precios 8 KB, búsqueda "harry" 18 KB.
- [ ] Footer en PC (contacto, horario, categorías, precios); en móvil queda por encima del Bottom Nav.

**Criterios de aceptación Fase 2**
- Matriz de pruebas completa sin scroll horizontal y sin tarjetas < 140 px.
- En 375 px el primer póster del catálogo está antes de y = 700 px.
- Lighthouse Accesibilidad ≥ 95 en móvil y escritorio.
- CLS < 0.05 en Inicio y Categoría.

---

## FASE 3 — Pipeline de imágenes

**Objetivo:** póster de grid de ~104 KB → ~15 KB en móvil, nítido en PC/retina, cacheado 1 año.
**Estimación:** 2–3 días. **Riesgo:** medio (script sobre 879 archivos). **Depende de:** columnas de Fase 1.1.

### 3.1 Variantes
| Variante | Tamaño | Uso | Peso objetivo |
|---|---|---|---|
| `thumb` | 320×480 WebP q55 | Grid/carruseles en móvil y PC 1x | 12–20 KB |
| `md` | 480×720 WebP q60 | Grid en PC retina / tablet | 25–35 KB |
| `full` | 900 px alto WebP q70 | Detalle del título | ≤ 120 KB |
| `poster_color` | `rgb()` dominante | Fondo instantáneo (LQIP de 0 bytes) | ~15 B |

- [ ] `<img srcset="thumb 320w, md 480w" sizes="(min-width:1536px) 200px, (min-width:1024px) 180px, (min-width:640px) 30vw, 48vw">` → el navegador elige según pantalla y densidad. Móvil descarga `thumb`, PC retina `md`.
- [ ] `loading="lazy"` + `fetchpriority="low"` salvo las primeras 4–6 tarjetas visibles (`eager` / `high`).
- [ ] Componente `Poster` (servidor) con contenedor `aspect-[2/3]` y fondo `poster_color`. Sin fade-in por `onLoad` (se rompe si la imagen ya está en caché antes de hidratar).

### 3.2 Subida desde el admin
- [ ] `src/utils/posterVariants.ts` (con `browser-image-compression` + `OffscreenCanvas` para el color), usado en **new y edit**.
- [ ] `/api/media/poster` acepta `full`, `md`, `thumb`, `color`; sube con `cacheControl: "31536000"` y nombres únicos (`{id}-{timestamp}-{variante}.webp`).
- [ ] Al reemplazar un póster, borrar las variantes viejas del bucket.
- [ ] Mismo tratamiento para el logo de `business_info` (`business.actions.ts` hoy sube sin `cacheControl`).

### 3.3 Backfill de los pósters existentes
- [ ] `scripts/backfill-posters.ts` con `sharp`: descarga original → genera `thumb`/`md`/`full` + color → sube con caché de 1 año → actualiza la fila. Idempotente (salta filas ya procesadas), con concurrencia 4 y log de errores.
- [ ] Verificación posterior: 0 filas con `poster_thumb_url` nulo y póster existente; muestreo de pesos.

**Criterios de aceptación Fase 3**
- Peso medio de póster en grid móvil ≤ 20 KB.
- Cabecera `cache-control: max-age=31536000` en pósters nuevos y re-procesados.
- Primera página de Inicio en móvil ≤ 400 KB totales.

---

## FASE 4 — PWA, offline y modo ahorro de datos

**Objetivo:** segunda visita casi sin consumo de datos, uso sin conexión y "instalable" en Android.
**Estimación:** 2–3 días. **Riesgo:** medio (errores de caché = contenido viejo). **Depende de:** Fases 1 y 3.

### 4.1 Service Worker (Serwist)
- [ ] `@serwist/next` (nota: Next 16 compila con Turbopack por defecto; Serwist requiere `next build --webpack` o su integración para Turbopack — validar antes de empezar).
- [ ] Estrategias:
  - Precache del shell (JS/CSS/íconos).
  - Pósters: **CacheFirst**, 400 entradas, 60 días.
  - Páginas HTML y `/api/catalog|media|pricing|descripcion`: **StaleWhileRevalidate**.
  - Fallback de navegación offline → `/offline`.
- [ ] Versionado y limpieza de cachés en cada deploy; aviso "Hay contenido nuevo — Actualizar" (toast) cuando el SW detecta versión nueva.
- [ ] Excluir `/admin` y `/api/*` de mutación del SW.

### 4.2 Manifest e instalación
- [ ] `app/manifest.ts`: nombre, íconos 192/512/maskable, `display: standalone`, `theme_color #161616`, `start_url /?source=pwa`, shortcuts (Estrenos, Precios, Mi pedido).
- [ ] Banner propio y discreto "Instala BGP en tu teléfono" (captura `beforeinstallprompt`, se muestra tras la 2.ª visita, descartable). En PC se ofrece desde el header.

### 4.3 Página offline
- [ ] `/offline`: últimos títulos vistos (desde caché), "Mi pedido" y botón WhatsApp (funciona sin datos móviles si hay WiFi luego).

### 4.4 Modo ahorro de datos
- [ ] Auto-activación si `navigator.connection.saveData` o `effectiveType` ∈ {`slow-2g`, `2g`}; interruptor manual en header (PC) / pestaña Más (móvil), persistido en `localStorage`.
- [ ] Con el modo activo: `html[data-saver]` oculta pósters (queda color + título + año), "Toca para ver póster" por tarjeta, carruseles reducidos, sin precarga de la página siguiente.
- [ ] Indicador en el header: "Ahorro de datos activo".

**Criterios de aceptación Fase 4**
- Lighthouse PWA instalable en Android.
- Segunda visita a Inicio con red: < 50 KB transferidos.
- Modo avión: Inicio y títulos ya vistos se abren; la página offline aparece en rutas no cacheadas.

---

## FASE 5 — Marketing, enganche y conversión

**Objetivo:** que cada visita tenga un camino de 1–2 toques hacia un pedido por WhatsApp.
**Estimación:** 3–4 días. **Riesgo:** bajo. **Depende de:** Fases 1–2 (datos y componentes).

### 5.1 Promos gestionables
- [ ] Tabla `promos (kind strip|card|hero, title, subtitle, cta_label, cta_url, starts_at, ends_at, priority, active)`.
- [ ] CRUD en el admin (`/admin/promos`) con vista previa móvil/PC.
- [ ] `PromoStrip`: franja bajo el header en todas las páginas públicas, cerrable (recordado por `promo.id`). PC: centrada en una línea; móvil: 1 línea con ellipsis + toque.
- [ ] `PromoCard`: tarjeta con forma de póster dentro del grid cada 12 ítems (no rompe la cuadrícula).
- [ ] `hero`: oferta relámpago que reemplaza el hero con cuenta regresiva en texto (`ends_at`).

### 5.2 "Paquete de la semana"
- [ ] Hero con badge `📦 Paquete de esta semana`, número de títulos nuevos (`created_at` últimos 7 días), resumen por categoría, fila de estrenos, CTA WhatsApp + Precios (diseño responsive en 2.7).
- [ ] (Opcional) Tabla `paquetes (numero, semana_inicio, tamano_gb, notas)` + `media.paquete_id` → "Paquete #47 · 1.3 TB", y página `/paquetes` con historial para pedir paquetes anteriores.

### 5.3 Pedido por WhatsApp
- [ ] Helper `waLink(baseUrl, texto)` a partir de `business_info.whatsapp_url`.
- [ ] Botón **"Encargar por WhatsApp"** en el detalle del título ("Hola, quiero: *Título* (año) – categoría").
- [ ] **"Mi pedido"**: `usePedido()` (localStorage, sincronizado entre pestañas); botón `＋` en tarjetas y detalle; página `/pedido` (móvil) / **panel lateral** (PC) con lista, quitar ítems y **"Enviar pedido por WhatsApp"** con la lista numerada.
- [ ] Búsqueda sin resultados → "¿No lo encuentras? Pídelo" con el término prellenado.
- [ ] Reactivar Telegram en `/descripcion` si existe canal; CTA "Únete al canal para recibir el listado semanal".

### 5.4 Prueba social (solo datos reales)
- [ ] Mostrar `⭐ 4.6 · 128 votos` (de `rating_count`).
- [ ] Tabla `pedido_clicks (media_id, created_at)` (insert anónimo con rate-limit) → carrusel **"🔥 Lo más pedido esta semana"**.
- [ ] Badge "Nuevo" (≤ 7 días) separado de "Estreno".

### 5.5 Medición
- [ ] Contadores propios (sin servicios de Google, que pueden estar bloqueados para IPs cubanas): clics en WhatsApp por origen (hero, detalle, pedido, búsqueda vacía, promo), instalaciones PWA, uso del modo ahorro. Panel en `/admin/dashboard`.

**Criterios de aceptación Fase 5**
- Desde cualquier tarjeta: ≤ 2 toques hasta abrir WhatsApp con el título prellenado.
- Promos creadas en el admin aparecen sin redeploy (revalidación) y respetan `starts_at`/`ends_at`.

---

## FASE 6 — Arreglos rápidos y limpieza *(la menos compleja)*

**Estimación:** 0.5–1 día. Varios quedan **absorbidos** por fases anteriores; se listan para que nada se pierda.

| # | Tarea | Archivo | Estado si se hicieron F1–F5 |
|---|---|---|---|
| 6.1 | `MediaCard` usa `media.avg_rating`; borrar `useMediaRating` en tarjetas | `components/MediaCard.tsx` | Absorbida (F2.4) |
| 6.2 | Quitar `<MediaModal />` duplicado | `app/page.tsx:109` | Absorbida (F1.5) |
| 6.3 | `range()` obligatorio en listados (tope 1000 filas) | `services/media.ts` | Absorbida (F1.2) |
| 6.4 | `Cache-Control` en GET públicos | `app/api/*/route.ts` | Absorbida (F1.2) |
| 6.5 | Comprimir póster también en edición | `admin/media/[id]/edit/page.tsx` | Absorbida (F3.2) |
| 6.6 | `<a>` → `<Link>`, búsqueda con `router.push` | `components/Navbar.tsx` | Absorbida (F2.2) |
| 6.7 | Desinstalar `swiper`, `@types/swiper` | `package.json` | Pendiente |
| 6.8 | Quitar `framer-motion` de componentes públicos (queda en admin si se usa) | varios | Pendiente |
| 6.9 | Borrar `ShootingStars`, `LoadingBike`, `Header.tsx` si quedan sin uso | `components/` | Pendiente |
| 6.10 | Quitar `@supabase/auth-helpers-nextjs` (deprecado; ya está `@supabase/ssr`) | `package.json` | Pendiente |
| 6.11 | Borrar `postcss.config.js` duplicado (existe también `.mjs`) y `src/app/globals.css` vs `src/styles/globals.css` (dejar uno) | raíz / `src/` | Pendiente |
| 6.12 | Quitar `console.error` de cliente en producción; tipar los `any` de handlers de filtros | varios | Pendiente |
| 6.13 | `next.config.ts`: quitar `placehold.co` de `remotePatterns` y usar un placeholder local (`/poster-fallback.svg`) | `next.config.ts`, `MediaCard` | Pendiente |
| 6.14 | Actualizar `docs/SupabaseDatabaseSchema.md` (faltan `estreno`, `idioma`, `seasons`, `slug`, columnas nuevas, `promos`) | `docs/` | Pendiente |

---

## Resumen

| Fase | Contenido | Complejidad | Días est. | Impacto principal |
|---|---|---|---|---|
| 0 | Inicio que convierte (hero, recomendada, ofertas, Mi pedido) | ★★★★☆ | 6–8 | Enganche y pedido por WhatsApp desde el primer segundo |
| A | Panel administrativo rediseñado (mismo diseño que la web, editores de Portada) | ★★★★☆ | 7–9 | La administradora controla promos y recomendada desde el teléfono |
| 1 | Arquitectura: SSR/ISR, datos mínimos, paginación, rutas de título, SQL | ★★★★★ | 5–7 | −85 % datos en 1.ª visita, contenido sin esperar JS |
| 2 | Rediseño responsive móvil/tablet/PC | ★★★★☆ | 5–6 | UX nativa en móvil, PC sin tarjetas diminutas ni espacio vacío |
| 3 | Pipeline de imágenes + backfill | ★★★☆☆ | 2–3 | Pósters de ~104 KB → ~15 KB, caché 1 año |
| 4 | PWA, offline, modo ahorro | ★★★☆☆ | 2–3 | 2.ª visita casi gratis, instalable |
| 5 | Marketing y conversión | ★★☆☆☆ | 3–4 | Camino directo a pedido por WhatsApp |
| 6 | Arreglos rápidos y limpieza | ★☆☆☆☆ | 0.5–1 | Deuda técnica cero |

**Objetivo global (a medir al cerrar cada fase):**

| | Hoy | Tras F1+F3 | Tras F4 (2.ª visita) |
|---|---|---|---|
| 1.ª visita a Inicio (móvil) | ≈ 3.5 MB, ~35 peticiones | ≈ 350–400 KB, ~15 | < 50 KB |
| Primer contenido visible en 3G | tras JS + JSON (~10–20 s) | primer HTML (~2–3 s) | instantáneo |
