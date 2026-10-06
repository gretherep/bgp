const TZ = "America/Havana";

/** "Termina en 2 d 14 h" / "Termina en 5 h" / null si ya venció o no tiene fin. */
export function tiempoRestante(hasta: string | null, ahora = Date.now()): string | null {
  if (!hasta) return null;
  const ms = new Date(hasta).getTime() - ahora;
  if (!(ms > 0)) return null;
  const h = Math.floor(ms / 36e5);
  if (h < 1) return "Termina en menos de 1 h";
  const d = Math.floor(h / 24);
  return d > 0 ? `Termina en ${d} d ${h % 24} h` : `Termina en ${h} h`;
}

/** "29 sep – 5 oct": semana actual de lunes a domingo, hora de Cuba. */
export function rangoSemanaActual(ahora = new Date()): string {
  const local = new Date(ahora.toLocaleString("en-US", { timeZone: TZ }));
  const lunes = new Date(local);
  lunes.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
  return `${fmt.format(lunes).replace(".", "")} – ${fmt.format(domingo).replace(".", "")}`;
}

const PLURAL: Record<string, [string, string]> = {
  "Películas": ["película", "películas"],
  "Películas Animadas": ["animada", "animadas"],
  "Películas Anime": ["película anime", "películas anime"],
  "Series": ["serie", "series"],
  "Series Animadas": ["serie animada", "series animadas"],
  "MiniSeries": ["miniserie", "miniseries"],
  "Anime": ["anime", "anime"],
  "Novelas": ["novela", "novelas"],
  "Reality Shows": ["reality", "realities"],
};

/** ["+4 películas", "+2 series"], ordenado de mayor a menor. */
export function resumenPorCategoria(items: { category: string }[]): string[] {
  const cuenta = new Map<string, number>();
  for (const m of items) cuenta.set(m.category, (cuenta.get(m.category) ?? 0) + 1);
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => {
      const [sing, plur] = PLURAL[cat] ?? [cat.toLowerCase(), cat.toLowerCase()];
      return `+${n} ${n === 1 ? sing : plur}`;
    });
}

/**
 * `idioma` es texto libre en la base ("Latino", "Dual-Audio", "Inglés-Subtitulado"...).
 * Lo convierte en una frase legible; si no reconoce el valor, lo devuelve tal cual.
 */
export function idiomaLegible(idioma: string | null | undefined): string | null {
  const raw = (idioma ?? "").trim();
  if (raw.length < 3) return null;
  const v = raw.toLowerCase();
  if (v.includes("dual")) return "Audio dual: español e inglés";
  if (v.includes("latino")) return "Audio en español latino";
  if (v.includes("castellano")) return "Audio en castellano";
  if (v.includes("subtitulad")) return "Subtitulada al español";
  if (v.startsWith("español")) return "Audio en español";
  return `Idioma: ${raw}`;
}

/** Razones verificables sacadas de los datos del título (respaldo de la recomendada y sugerencias del editor). */
export function razonesSugeridas(media: {
  estreno?: boolean | null;
  seasons?: number | null;
  idioma?: string | null;
  genre?: string | null;
}, paqueteTamano: string): string[] {
  const r: string[] = [];
  if (media.estreno) r.push("Estreno de la semana");
  if (media.seasons) r.push(Number(media.seasons) === 1 ? "Temporada completa" : `${media.seasons} temporadas completas`);
  const idioma = idiomaLegible(media.idioma);
  if (idioma) r.push(idioma);
  const generos = generosCortos(media.genre);
  if (generos.length) r.push(`Ideal si te gusta: ${generos.join(" y ").toLowerCase()}`);
  r.push(`Incluida en el paquete de ${paqueteTamano}`);
  return r;
}

export function generosCortos(genre: string | null | undefined, max = 2): string[] {
  // Los géneros se guardan unidos con guion, coma o barra ("Comedia-Drama", "Terror, Misterio").
  return (genre ?? "")
    .replace(/sci-fi/gi, "Ciencia ficción")
    .split(/[,/\-–]+/)
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, max);
}
