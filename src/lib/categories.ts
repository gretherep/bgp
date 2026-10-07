// Filtros del catálogo compartidos por servidor y cliente (sin "server-only").

export type CategoriaFiltro = {
  slug: string;
  label: string;
  categorias: string[];
  emoji: string;
  /** Para frases como "Pedir una película": artículo + nombre en singular. */
  una: string;
  /** Qué incluye, en lenguaje del cliente (cabecera de la página de categoría). */
  incluye: string;
};

/** Categorías navegables. Cada una agrupa uno o más valores de media.category. */
export const CATEGORIAS: CategoriaFiltro[] = [
  { slug: "peliculas", label: "Películas", categorias: ["Películas"], emoji: "🎬", una: "una película", incluye: "Estrenos y clásicos, doblados o subtitulados." },
  { slug: "series", label: "Series", categorias: ["Series", "MiniSeries"], emoji: "📺", una: "una serie", incluye: "Series y miniseries, por temporada completa." },
  { slug: "animados", label: "Animados", categorias: ["Películas Animadas", "Series Animadas"], emoji: "🧸", una: "un animado", incluye: "Películas y series animadas para toda la familia." },
  { slug: "anime", label: "Anime", categorias: ["Anime", "Películas Anime"], emoji: "🎌", una: "un anime", incluye: "Series y películas de anime." },
  { slug: "novelas", label: "Novelas", categorias: ["Novelas"], emoji: "💞", una: "una novela", incluye: "Novelas completas o por capítulos." },
  { slug: "reality", label: "Reality", categorias: ["Reality Shows"], emoji: "🎤", una: "un reality", incluye: "Realities y concursos, por capítulos." },
];

export type GeneroFiltro = { slug: string; label: string; emoji: string; mood?: string; patrones: string[] };

/**
 * media.genre es texto libre ("Terror-Misterio", "CienciaFicción", "Acción-Thriller"...).
 * Cada grupo busca por fragmentos (ilike), sin tilde final cuando el dato varía.
 * `mood` es el texto del chip en "¿Qué quieres ver hoy?".
 */
export const GENEROS: GeneroFiltro[] = [
  { slug: "comedia", label: "Comedia", emoji: "😂", mood: "Para reír", patrones: ["comedia", "sitcom"] },
  { slug: "accion", label: "Acción", emoji: "💥", mood: "Acción", patrones: ["acci"] },
  { slug: "terror", label: "Terror", emoji: "😱", mood: "Para pasar miedo", patrones: ["terror", "horror"] },
  { slug: "suspenso", label: "Suspenso y crimen", emoji: "🔍", mood: "Suspenso", patrones: ["suspenso", "thriller", "misterio", "crimen"] },
  { slug: "romance", label: "Romance", emoji: "💕", mood: "Romance", patrones: ["romance", "románti", "romanti"] },
  { slug: "familia", label: "En familia", emoji: "👨‍👩‍👧", mood: "En familia", patrones: ["famil", "animado", "animaci", "ghibli"] },
  { slug: "ciencia-ficcion", label: "Ciencia ficción", emoji: "🚀", mood: "Ciencia ficción", patrones: ["ciencia", "sci-fi"] },
  { slug: "drama", label: "Drama", emoji: "🎭", mood: "Drama", patrones: ["drama"] },
  { slug: "aventura", label: "Aventura", emoji: "🗺️", patrones: ["aventura"] },
  { slug: "fantasia", label: "Fantasía", emoji: "🧙", patrones: ["fantas"] },
  { slug: "musical", label: "Musical", emoji: "🎵", patrones: ["musical", "música"] },
  { slug: "documental", label: "Documental", emoji: "🎬", patrones: ["documental", "biograf"] },
];

export type AnioFiltro = { slug: string; label: string; min?: number; max?: number };

/** Últimos 3 años sueltos + décadas, calculado desde el año actual. */
export function aniosFiltro(anioActual = new Date().getFullYear()): AnioFiltro[] {
  const a = anioActual;
  return [
    { slug: String(a), label: String(a), min: a, max: a },
    { slug: String(a - 1), label: String(a - 1), min: a - 1, max: a - 1 },
    { slug: String(a - 2), label: String(a - 2), min: a - 2, max: a - 2 },
    { slug: "2020s", label: `2020–${a - 3}`, min: 2020, max: a - 3 },
    { slug: "2010s", label: "2010–2019", min: 2010, max: 2019 },
    { slug: "2000s", label: "2000–2009", min: 2000, max: 2009 },
    { slug: "clasicos", label: "Clásicos", max: 1999 },
  ];
}

export const ORDENES = [
  { slug: "estrenos", label: "Estrenos primero" },
  { slug: "recientes", label: "Recién agregados" },
  { slug: "valorados", label: "Mejor valorados" },
  { slug: "az", label: "A–Z" },
] as const;

export type Orden = (typeof ORDENES)[number]["slug"];

export type FiltrosCatalogo = {
  cat: string | null;
  anio: string | null;
  generos: string[];
  orden: Orden;
  /** Solo títulos marcados como estreno (?estreno=1). */
  estreno: boolean;
};

export const FILTROS_VACIOS: FiltrosCatalogo = { cat: null, anio: null, generos: [], orden: "estrenos", estreno: false };

export const PAGE_SIZE = 24;

/** Lee y valida los filtros desde la URL; descarta valores desconocidos. */
export function filtrosDesdeParams(p: URLSearchParams): FiltrosCatalogo {
  const cat = p.get("cat");
  const anio = p.get("anio");
  const orden = p.get("orden");
  return {
    cat: CATEGORIAS.some((c) => c.slug === cat) ? cat : null,
    anio: aniosFiltro().some((a) => a.slug === anio) ? anio : null,
    generos: (p.get("g") ?? "").split(",").filter((g) => GENEROS.some((x) => x.slug === g)),
    orden: ORDENES.some((o) => o.slug === orden) ? (orden as Orden) : "estrenos",
    estreno: p.get("estreno") === "1",
  };
}

export function filtrosAParams(f: FiltrosCatalogo): URLSearchParams {
  const p = new URLSearchParams();
  if (f.cat) p.set("cat", f.cat);
  if (f.anio) p.set("anio", f.anio);
  if (f.generos.length) p.set("g", f.generos.join(","));
  if (f.orden !== "estrenos") p.set("orden", f.orden);
  if (f.estreno) p.set("estreno", "1");
  return p;
}

export function cuentaFiltrosActivos(f: FiltrosCatalogo): number {
  return (f.cat ? 1 : 0) + (f.anio ? 1 : 0) + f.generos.length + (f.orden !== "estrenos" ? 1 : 0) + (f.estreno ? 1 : 0);
}
