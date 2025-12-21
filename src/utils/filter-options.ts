import { MEDIA_CATEGORIES } from "@/app/models/media-categories";
import { MEDIA_GENRES } from "@/app/models/media-genres";

export const categoryOptions = MEDIA_CATEGORIES.map(cat => ({
  value: cat,
  label: cat,
}));

export const genreOptions = MEDIA_GENRES.map(genre => ({
  value: genre,
  label: genre,
}));
