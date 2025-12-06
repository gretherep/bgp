// app/media/MediaForm.tsx
import React, { useState, FormEvent } from "react";
import { Media } from "../models/media";

interface MediaFormProps {
  onSubmit: (formData: FormData) => Promise<void>; // <-- aquí
  initialData?: Media;
  userRole: "user" | "admin";
}

export default function MediaForm({ onSubmit, initialData, userRole }: MediaFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [synopsis, setSynopsis] = useState(initialData?.synopsis ?? "");
  const [posterUrl, setPosterUrl] = useState(initialData?.poster_url ?? "");
  const [genre, setGenre] = useState(initialData?.genre ?? "");
  const [year, setYear] = useState(initialData?.year ?? 0);
  const [category, setCategory] = useState(initialData?.category ?? "");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("synopsis", synopsis);
    formData.set("poster_url", posterUrl);
    formData.set("genre", genre);
    formData.set("year", year.toString());
    formData.set("category", category);

    await onSubmit(formData);
  };

  if (userRole !== "admin") return null; // solo admins pueden ver el form

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-4 rounded-md">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
      <input value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="Sinopsis" />
      <input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="URL Poster" />
      <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género" />
      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} placeholder="Año" />
      <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoría" />
      <button type="submit">Guardar</button>
    </form>
  );
}
