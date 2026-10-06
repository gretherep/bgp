// Relación entre la categoría del título y la fila de pricing_categories que la cobra.
type Tarifa = { tarifa: string; unidad: string; modo: "unidad" | "temporada" | "capitulo" };

const TARIFA: Record<string, Tarifa> = {
  "Películas": { tarifa: "Películas", unidad: "c/u", modo: "unidad" },
  "Películas Animadas": { tarifa: "Películas", unidad: "c/u", modo: "unidad" },
  "Películas Anime": { tarifa: "Películas", unidad: "c/u", modo: "unidad" },
  "Series": { tarifa: "Series", unidad: "por temporada", modo: "temporada" },
  "MiniSeries": { tarifa: "Series", unidad: "por temporada", modo: "temporada" },
  "Series Animadas": { tarifa: "Series", unidad: "por temporada", modo: "temporada" },
  "Anime": { tarifa: "Anime", unidad: "por temporada", modo: "temporada" },
  "Novelas": { tarifa: "Novelas", unidad: "por capítulo", modo: "capitulo" },
  "Reality Shows": { tarifa: "Reality Shows", unidad: "por capítulo", modo: "capitulo" },
};

export type TarifaBase = Omit<Tarifa, "tarifa"> & { nombre: string; cubre: string[] };

/** Las tarifas que existen (filas de pricing_categories) y qué categorías de título cobra cada una. */
export const TARIFAS: TarifaBase[] = Object.values(
  Object.entries(TARIFA).reduce<Record<string, TarifaBase>>((acc, [categoria, t]) => {
    acc[t.tarifa] ??= { nombre: t.tarifa, unidad: t.unidad, modo: t.modo, cubre: [] };
    acc[t.tarifa].cubre.push(categoria);
    return acc;
  }, {}),
);

export type Precio = { category: string; price: number; currency: string };

const fmt = (n: number) => n.toLocaleString("es");

/** "Desde 100 CUP por temporada", o null si la categoría no tiene tarifa activa. */
export function precioSuelto(category: string, precios: Precio[]): string | null {
  const t = TARIFA[category];
  if (!t) return null;
  const p = precios.find((x) => x.category === t.tarifa);
  return p ? `Desde ${fmt(p.price)} ${p.currency} ${t.unidad}` : null;
}

export type PrecioItem = { monto: number | null; moneda: string | null; texto: string };

/**
 * Precio estimado de un título en el pedido. Películas: precio por unidad. Series y anime:
 * precio × temporadas. Novelas y realities se cobran por capítulo: no suman al total.
 */
export function precioItem(category: string, seasons: number | null, precios: Precio[]): PrecioItem {
  const t = TARIFA[category];
  const p = t && precios.find((x) => x.category === t.tarifa);
  if (!t || !p) return { monto: null, moneda: null, texto: "Precio a consultar" };
  if (t.modo === "capitulo") return { monto: null, moneda: p.currency, texto: `${fmt(p.price)} ${p.currency} por capítulo` };
  if (t.modo === "temporada") {
    const temps = Math.max(1, seasons ?? 1);
    return {
      monto: p.price * temps,
      moneda: p.currency,
      texto: `${fmt(p.price * temps)} ${p.currency} · ${temps} ${temps === 1 ? "temporada" : "temporadas"}`,
    };
  }
  return { monto: p.price, moneda: p.currency, texto: `${fmt(p.price)} ${p.currency}` };
}
