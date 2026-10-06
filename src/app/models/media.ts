import { MediaCategory } from "./media-categories";
import { MediaGenre } from "./media-genres";

export interface Media {
  id: string;
  title: string;
  synopsis: string;
  poster_url?: string | null;
  // Versiones livianas (docs/sql/005_poster_variantes.sql); vacías si el título aún no se procesó.
  poster_thumb_url?: string | null;
  poster_md_url?: string | null;
  poster_full_url?: string | null;
  poster_color?: string | null;
  genre: MediaGenre;
  year: number;
  category: MediaCategory;
  estreno?: boolean | null; 
  idioma?: string | null;
  seasons?: number | null;
  created_at: string;
  updated_at: string;
  slug: string;
}
