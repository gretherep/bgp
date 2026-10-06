// Fase 3 · Elige la versión del póster según dónde se muestra (docs/sql/005_poster_variantes.sql).
// Si el título todavía no tiene versiones (póster nuevo pegado por URL, script sin ejecutar), usa el original.

export type ConPoster = {
  poster_url?: string | null;
  poster_thumb_url?: string | null;
  poster_md_url?: string | null;
  poster_full_url?: string | null;
  poster_color?: string | null;
};

type Uso =
  /** Miniaturas del panel y de "Mi pedido" (≤ 60 px): siempre la de 320 px. */
  | "mini"
  /** Tarjetas y carruseles: el navegador elige 320 o 480 px según `sizes` y la densidad de la pantalla. */
  | "tarjeta"
  /** Ficha y recomendada: de 320 px a la grande (900 px de alto), según `sizes`. */
  | "grande";

export type PosterImg = { src: string; srcSet?: string; sizes?: string; style?: React.CSSProperties };

export function posterImg(m: ConPoster, uso: Uso, sizes?: string): PosterImg | null {
  const original = m.poster_url || null;
  if (!original) return null;
  // Color medio de fondo: el hueco de la tarjeta ya tiene el tono del póster mientras carga.
  const style = m.poster_color ? { backgroundColor: m.poster_color } : undefined;
  const { poster_thumb_url: thumb, poster_md_url: md, poster_full_url: full } = m;

  if (uso === "mini") return { src: thumb || original, style };
  if (uso === "tarjeta") {
    if (thumb && md) return { src: thumb, srcSet: `${thumb} 320w, ${md} 480w`, sizes, style };
    return { src: original, style };
  }
  if (thumb && md && full) return { src: full, srcSet: `${thumb} 320w, ${md} 480w, ${full} 600w`, sizes, style };
  return { src: full || original, style };
}
