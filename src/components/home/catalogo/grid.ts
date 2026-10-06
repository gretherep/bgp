/**
 * Cuadrícula de pósters del catálogo (Inicio, Categoría, Búsqueda).
 * 2 columnas en móvil, 4 en tablet, 6 en 1024, 7 en 1280–1440 y 8 en 1920 (nunca menos de 140 px).
 */
export const GRID_POSTERS =
  "grid gap-x-3 gap-y-5 sm:gap-x-4 [grid-template-columns:repeat(auto-fill,minmax(clamp(140px,11.5vw,172px),1fr))]";
