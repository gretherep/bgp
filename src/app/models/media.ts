import { MediaCategory } from "./media-categories";
import { MediaGenre } from "./media-genres";

export interface Media {
  id: string;
  title: string;
  synopsis: string;
  poster_url?: string | null;
  genre: MediaGenre;
  year: number;
  category: MediaCategory;
  estreno?: boolean | null; 
  idioma?: string | null;
  created_at: string;
  updated_at: string;
  slug: string;
}
