// Fase 3 · Genera las versiones livianas de los pósters existentes y las sube a Supabase.
//
//   node scripts/posters-variantes.mjs --prueba         no sube nada: muestra pesos de 10 pósters
//   node scripts/posters-variantes.mjs                  procesa todos los que no tienen versiones
//   node scripts/posters-variantes.mjs --limite 20      procesa como máximo 20
//
// Por cada título con poster_url y sin poster_thumb_url:
//   descarga el original → thumb 320×480 / md 480×720 / full 900 px de alto (WebP) + color medio
//   → sube a posters/variantes/<id>/<tipo>-<hash>.webp con caché de 1 año → guarda las 4 columnas.
// Se puede volver a ejecutar: salta los ya procesados. Requiere docs/sql/005_poster_variantes.sql.
// Usa sharp (viene instalado con Next) y la service role de .env.local.

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";

const args = process.argv.slice(2);
const PRUEBA = args.includes("--prueba");
const LIMITE = Number(args[args.indexOf("--limite") + 1]) || (PRUEBA ? 10 : Infinity);
const CONCURRENCIA = 4;
const BUCKET = "posters";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

/** Reintenta ante cortes de red (la conexión a Supabase a veces se cae unos segundos). */
async function conReintentos(nombre, fn, intentos = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= intentos) throw new Error(`${nombre}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

const sinError = (r) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

async function variantes(original) {
  const webp = (img, q) => img.webp({ quality: q, effort: 6 }).toBuffer();
  const [thumb, md, full, pixel] = await Promise.all([
    webp(sharp(original).resize(320, 480, { fit: "cover" }), 55),
    webp(sharp(original).resize(480, 720, { fit: "cover" }), 60),
    webp(sharp(original).resize({ height: 900, withoutEnlargement: true }), 70),
    sharp(original).resize(1, 1, { fit: "cover" }).removeAlpha().raw().toBuffer(),
  ]);
  return { thumb, md, full, color: `rgb(${pixel[0]},${pixel[1]},${pixel[2]})` };
}

async function procesar(m, stats) {
  const original = await conReintentos("descarga", async () => {
    const res = await fetch(m.poster_url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  });
  const v = await variantes(original);
  stats.antes += original.length;
  stats.despues += v.thumb.length;
  if (PRUEBA) {
    const kb = (b) => `${Math.round(b.length / 1024)} KB`;
    console.log(`  ${m.title.slice(0, 40).padEnd(40)} original ${kb(original)} → thumb ${kb(v.thumb)} · md ${kb(v.md)} · full ${kb(v.full)} · ${v.color}`);
    return;
  }

  // Nombre con hash del original: si cambia el póster, cambia la URL (por eso se puede cachear 1 año).
  const hash = createHash("sha1").update(original).digest("hex").slice(0, 10);
  const urls = {};
  for (const tipo of ["thumb", "md", "full"]) {
    const ruta = `variantes/${m.id}/${tipo}-${hash}.webp`;
    await conReintentos(`subida ${tipo}`, async () =>
      sinError(await sb.storage.from(BUCKET).upload(ruta, v[tipo], { contentType: "image/webp", cacheControl: "31536000", upsert: true })),
    );
    urls[tipo] = sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  }
  await conReintentos("guardar", async () =>
    sinError(
      await sb
        .from("media")
        .update({ poster_thumb_url: urls.thumb, poster_md_url: urls.md, poster_full_url: urls.full, poster_color: v.color })
        .eq("id", m.id)
        .eq("poster_url", m.poster_url), // si alguien cambió el póster mientras tanto, no se pisa
    ),
  );
}

const pendientes = (
  await conReintentos("lista", async () =>
    sinError(
      await sb.from("media").select("id,title,poster_url").not("poster_url", "is", null).is("poster_thumb_url", null).order("created_at", { ascending: false }).range(0, 1999),
    ),
  )
).slice(0, LIMITE);

console.log(`${PRUEBA ? "PRUEBA (no se sube nada): " : ""}${pendientes.length} pósters por procesar\n`);
const stats = { ok: 0, errores: [], antes: 0, despues: 0 };
let siguiente = 0;
await Promise.all(
  Array.from({ length: CONCURRENCIA }, async () => {
    while (siguiente < pendientes.length) {
      const m = pendientes[siguiente++];
      try {
        await procesar(m, stats);
        stats.ok++;
        if (!PRUEBA && stats.ok % 25 === 0) console.log(`  ${stats.ok}/${pendientes.length}`);
      } catch (e) {
        stats.errores.push(`${m.title}: ${e.message}`);
      }
    }
  }),
);

const mb = (b) => (b / 1048576).toFixed(1);
console.log(`\nListos: ${stats.ok} · Con error: ${stats.errores.length}`);
if (stats.ok) console.log(`Tarjetas en el móvil: ${mb(stats.antes)} MB → ${mb(stats.despues)} MB (${Math.round((1 - stats.despues / stats.antes) * 100)}% menos)`);
if (stats.errores.length) {
  console.log("Errores (vuelve a ejecutar el script para reintentar solo esos):");
  stats.errores.forEach((e) => console.log(`  - ${e}`));
}
