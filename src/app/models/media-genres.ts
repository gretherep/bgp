export const MEDIA_GENRES = [
  "Acción",
  "Aventura",
  "Animación",
  "Comedia",
  "Crimen",
  "Documental",
  "Drama",
  "Fantasía",
  "Historia",
  "Horror",
  "Misterio",
  "Romance",
  "Ciencia Ficción",
  "Suspenso",
  "Terror",
  "Western",
  "Musical",
  "Bélico",
  "Familiar",
] as const;

export type MediaGenre = typeof MEDIA_GENRES[number];
