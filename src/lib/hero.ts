// Texto de bienvenida del Inicio (columna izquierda del Hero). Lo edita la admin en Portada
// (business_info.hero, docs/sql/006_texto_bienvenida.sql). Lo que hace cada chip es fijo.

export type HeroTextos = {
  titulo: string;
  /** Segunda parte del titular, en color durazno. Puede ir vacía. */
  destacado: string;
  subtexto: string;
  chips: { peliculas: string; series: string; top: string };
};

export const HERO_ORIGINAL: HeroTextos = {
  titulo: "¿Qué vas a mirar",
  destacado: "este fin de semana?",
  subtexto: "Explora los estrenos más recientes de Netflix, HBO, cines y anime. Todo preparado para que te desconectes.",
  chips: { peliculas: "🍿 Películas de Cine", series: "📺 Series de Estreno", top: "🔥 Lo Más Pedido" },
};

export const HERO_LIMITES = { titulo: 50, destacado: 50, subtexto: 180, chip: 28 };

/** Qué hace cada chip (fijo): se muestra en el panel para que se sepa a dónde lleva. */
export const HERO_CHIPS_DESTINO = {
  peliculas: "Filtra Películas y baja al catálogo",
  series: "Filtra Series en estreno y baja al catálogo",
  top: "Baja al Top 10 mejor valorados",
} as const;

const limpio = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Lo guardado + el original para lo que falte (un campo vacío vuelve al original, salvo `destacado`). */
export function heroDesde(raw: unknown): HeroTextos {
  if (!raw || typeof raw !== "object") return HERO_ORIGINAL;
  const r = raw as Partial<Record<keyof HeroTextos, unknown>> & { chips?: Partial<Record<string, unknown>> };
  const L = HERO_LIMITES;
  return {
    titulo: limpio(r.titulo, L.titulo) || HERO_ORIGINAL.titulo,
    destacado: typeof r.destacado === "string" ? limpio(r.destacado, L.destacado) : HERO_ORIGINAL.destacado,
    subtexto: limpio(r.subtexto, L.subtexto) || HERO_ORIGINAL.subtexto,
    chips: {
      peliculas: limpio(r.chips?.peliculas, L.chip) || HERO_ORIGINAL.chips.peliculas,
      series: limpio(r.chips?.series, L.chip) || HERO_ORIGINAL.chips.series,
      top: limpio(r.chips?.top, L.chip) || HERO_ORIGINAL.chips.top,
    },
  };
}
