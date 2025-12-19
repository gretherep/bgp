"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { Upload, ImageIcon, Loader2, X, ArrowLeft } from "lucide-react";

const POSTER_BUCKET = "posters";

const categories = [
  "Películas", "Series", "Novelas", "Reality Shows", "MiniSeries",
  "Series Animadas", "Películas Animadas", "Anime", "Películas Anime",
];

export default function EditMediaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    poster_url: "",
    genre: "",
    year: "",
    category: "",
  });

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        synopsis: data.synopsis,
        poster_url: data.poster_url || "",
        genre: data.genre,
        year: data.year.toString(),
        category: data.category,
      });
      setImagePreviewUrl(data.poster_url || null);
    } catch (err: any) {
      alert("Error al cargar media: " + err.message);
      router.push("/admin/media");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPosterFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, poster_url: "" }));
    } else {
      setPosterFile(null);
      setImagePreviewUrl(formData.poster_url || null);
    }
  };

  const handleRemoveImage = () => {
    setPosterFile(null);
    setImagePreviewUrl(null);
    setFormData((prev) => ({ ...prev, poster_url: "" }));
  };

  const uploadPoster = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(POSTER_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Error al subir el archivo: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(POSTER_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalPosterUrl = formData.poster_url;

    try {
      if (posterFile) {
        finalPosterUrl = await uploadPoster(posterFile);
      }

      const { error } = await supabase
        .from("media")
        .update({
          title: formData.title,
          synopsis: formData.synopsis,
          poster_url: finalPosterUrl || null,
          genre: formData.genre,
          year: parseInt(formData.year),
          category: formData.category,
        })
        .eq("id", id);

      if (error) throw error;

      router.push("/admin/media");
    } catch (err: any) {
      alert("Error al actualizar media: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-gray-400">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 min-h-screen bg-gray-950">
      {/* Botón de volver */}
      <div className="mb-8 mt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Media
        </button>
      </div>

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Upload className="w-7 h-7 text-indigo-400" />
          Editar Contenido
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Actualiza los detalles de <span className="font-medium text-white">{formData.title}</span></p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">
        {/* Sección de imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Preview */}
          <div className="flex flex-col">
            <label className="block text-white font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Vista previa del póster
            </label>
            <div className="relative w-full max-w-xs mx-auto">
              <div className="relative w-full aspect-[2/3] bg-gray-700 rounded-xl overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
                {imagePreviewUrl ? (
                  <div className="w-full h-full relative">
                    <Image
                      src={imagePreviewUrl}
                      alt="Poster Preview"
                      fill
                      className="object-cover transition-opacity duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg transition-all duration-200 z-10"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Sin imagen</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload / URL */}
          <div className="space-y-5">
            <div>
              <label className="block text-white font-medium mb-2">Subir nueva imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:transition-colors bg-gray-700 rounded-lg px-3 py-2.5 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Reemplaza el póster actual (JPG, PNG, WEBP)</p>
            </div>

            <div className="border-t border-gray-700/50 pt-5">
              <label className="block text-white font-medium mb-2">O usar URL externa</label>
              <input
                type="url"
                name="poster_url"
                value={formData.poster_url}
                onChange={(e) => {
                  handleChange(e);
                  setPosterFile(null);
                  setImagePreviewUrl(e.target.value);
                }}
                disabled={!!posterFile}
                className={`w-full px-4 py-2.5 bg-gray-700 border ${
                  posterFile
                    ? "border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed"
                    : "border-gray-600 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                } rounded-lg transition-colors`}
                placeholder="https://ejemplo.com/poster.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                {posterFile ? "Deshabilitado al subir archivo" : "Opcional si no subes una imagen"}
              </p>
            </div>
          </div>
        </div>

        {/* Campos de texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-white font-medium mb-2">Título</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Género</label>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Año</label>
            <input
              type="number"
              name="year"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Categoría</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
            >
              <option value="" disabled>Seleccionar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-white font-medium mb-2">Sinopsis</label>
          <textarea
            name="synopsis"
            value={formData.synopsis}
            onChange={handleChange}
            rows={4}
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-60 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Actualizar Contenido
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}