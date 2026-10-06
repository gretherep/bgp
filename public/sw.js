/* Service worker de BGP Paquete (Fase 4). Escrito a mano, sin dependencias.
 *
 * - Páginas: primero la red (máx. 4 s); si no llega, la copia guardada; si no hay, /offline.
 *   Así con conexión nunca se muestra contenido viejo, y con la red mala o sin red el sitio abre igual.
 * - /_next/static (nombres con hash, nunca cambian) y pósters (caché de 1 año): primero lo guardado.
 *   Los pósters se piden con CORS para no guardar respuestas opacas.
 * - /api/catalog y /api/pedido-config (lecturas): responde lo guardado y actualiza por detrás.
 * - /admin, el resto de /api y todo lo que no sea GET: no se tocan.
 *
 * Al cambiar la lógica de este archivo, subir VERSION: el activate borra las cachés de la versión anterior.
 */
const VERSION = "v1";
const C = {
  paginas: `bgp-paginas-${VERSION}`,
  estaticos: `bgp-estaticos-${VERSION}`,
  posters: `bgp-posters-${VERSION}`,
  api: `bgp-api-${VERSION}`,
};
const LIMITES = { [C.paginas]: 60, [C.estaticos]: 200, [C.posters]: 400, [C.api]: 60 };
const OFFLINE = "/offline";
const ESPERA_RED_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(C.paginas)
      .then((c) => c.addAll([OFFLINE, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith("bgp-") && !Object.values(C).includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Deja la caché en su límite borrando las entradas más viejas. */
async function recortar(nombre) {
  const cache = await caches.open(nombre);
  const claves = await cache.keys();
  const sobran = claves.length - LIMITES[nombre];
  for (let i = 0; i < sobran; i++) await cache.delete(claves[i]);
}

async function guardar(nombre, request, response) {
  // Solo respuestas completas (nunca opacas: Chrome les cobra ~7 MB de cuota a cada una).
  if (!response || response.status !== 200) return;
  const cache = await caches.open(nombre);
  await cache.put(request, response);
  recortar(nombre);
}

async function primeroGuardado(nombre, request) {
  const guardada = await caches.match(request, { cacheName: nombre });
  if (guardada) return guardada;
  const res = await fetch(request);
  guardar(nombre, request, res.clone());
  return res;
}

/** Pósters: se piden con CORS (Supabase responde Access-Control-Allow-Origin: *) para poder guardarlos. */
async function poster(request) {
  const clave = request.url;
  const guardada = await caches.match(clave, { cacheName: C.posters });
  if (guardada) return guardada;
  try {
    const res = await fetch(clave, { mode: "cors", credentials: "omit" });
    guardar(C.posters, clave, res.clone());
    return res;
  } catch {
    return fetch(request); // sin CORS: se muestra igual, solo que no queda guardado
  }
}

async function guardadoYActualizar(nombre, request) {
  const guardada = await caches.match(request, { cacheName: nombre });
  const red = fetch(request)
    .then((res) => {
      guardar(nombre, request, res.clone());
      return res;
    })
    .catch(() => null);
  return guardada || (await red) || new Response(JSON.stringify({ error: "Sin conexión" }), { status: 503, headers: { "Content-Type": "application/json" } });
}

async function pagina(event) {
  const { request } = event;
  const red = fetch(request).then((res) => {
    if (res.ok) guardar(C.paginas, request, res.clone());
    return res;
  });
  // La copia se sigue actualizando aunque se haya respondido con lo guardado.
  event.waitUntil(red.catch(() => {}));
  const lenta = new Promise((resolve) => setTimeout(resolve, ESPERA_RED_MS, null));
  try {
    const rapida = await Promise.race([red, lenta]);
    if (rapida) return rapida;
    const guardada = await caches.match(request, { cacheName: C.paginas });
    return guardada || (await red);
  } catch {
    return (await caches.match(request, { cacheName: C.paginas })) || (await caches.match(OFFLINE)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Pósters (Supabase Storage, otro dominio).
  if (url.pathname.includes("/storage/v1/object/public/posters/")) {
    event.respondWith(poster(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(primeroGuardado(C.estaticos, request));
    return;
  }
  if (url.pathname === "/api/catalog" || url.pathname === "/api/pedido-config") {
    event.respondWith(guardadoYActualizar(C.api, request));
    return;
  }
  // Navegaciones de página completa (no las peticiones RSC de Next, que dependen de cabeceras).
  if (request.mode === "navigate" && !url.pathname.startsWith("/api/")) {
    event.respondWith(pagina(event));
  }
});
