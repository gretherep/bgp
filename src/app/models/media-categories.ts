export const MEDIA_CATEGORIES = [
  "Películas",
  "Series",
  "Novelas",
  "Reality Shows",
  "MiniSeries",
  "Series Animadas",
  "Películas Animadas",
  "Anime",
  "Películas Anime",
] as const;

export type MediaCategory = typeof MEDIA_CATEGORIES[number];
