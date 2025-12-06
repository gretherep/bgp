declare module '*.css';

export interface Profile {
  id: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Media {
  id: string;
  title: string;
  synopsis: string;
  poster_url?: string;
  genre: string;
  year: number;
  category:
    | 'Películas'
    | 'Series'
    | 'Novelas'
    | 'Reality Shows'
    | 'MiniSeries'
    | 'Series Animadas'
    | 'Películas Animadas'
    | 'Anime'
    | 'Películas Anime';
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  media_id: string;
  rating: number; // 1 to 5
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  media_id: string;
  comment: string;
  created_at: string;
}
