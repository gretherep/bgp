// app/models/media.ts
export interface Media {
  id: string;
  title: string;
  synopsis: string;
  poster_url?: string | null;
  genre: string;
  year: number;
  category:
    | "Películas"
    | "Series"
    | "Novelas"
    | "Reality Shows"
    | "MiniSeries"
    | "Series Animadas"
    | "Películas Animadas"
    | "Anime"
    | "Películas Anime";
  created_at: string;
  updated_at: string;
  slug: string;

}
