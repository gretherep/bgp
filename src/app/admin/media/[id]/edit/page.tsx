"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { api } from "@/utils/apiClient";
import Image from "next/image";
import { Upload, ImageIcon, Loader2, X, ArrowLeft, Star, Languages, Layers } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { Media } from "@/app/models/media";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);


const POSTER_BUCKET = "posters";

const categories = [
  "Películas", "Series", "Novelas", "Reality Shows", "MiniSeries",
  "Series Animadas", "Películas Animadas", "Anime", "Películas Anime",
];

// Reutilizamos la lógica de tipos: Omitimos lo innecesario y convertimos números a string para los inputs
type MediaFormState = Omit<Media, "id" | "created_at" | "updated_at" | "slug" | "year" | "seasons"> & {
  year: string;
  seasons: string;
};

export default function EditMediaPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { showToast } = useToast();

  const returnPage = searchParams.get("returnPage") || "1";
  const returnSearch = searchParams.get("returnSearch") || "";

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<MediaFormState>({
    title: "",
    synopsis: "",
    poster_url: "",
    genre: "" as any,
    year: "",
    category: "" as any,
    idioma: "",
    estreno: false,
    seasons: "", // ✅ Ahora incluido
  });

  // Lógica para mostrar temporadas (igual que en Create)
  const showSeasonsField = useMemo(() => {
    const cat = formData.category?.toLowerCase() || "";
    return cat.includes("serie") || cat.includes("anime") || cat.includes("novela") || cat.includes("reality");
  }, [formData.category]);

  const handleGoBack = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", returnPage);
    if (returnSearch) params.set("search", returnSearch);
    router.push(`/admin/media?${params.toString()}`);
  }, [router, returnPage, returnSearch]);

  const fetchMedia = useCallback(async () => {
    try {
      const data = await api.get(`/api/media?id=${id}`);

      if (data) {
        setFormData({
          title: data.title,
          synopsis: data.synopsis,
          poster_url: data.poster_url || "",
          genre: data.genre,
          year: data.year.toString(),
          category: data.category,
          idioma: data.idioma || "",
          estreno: !!data.estreno,
          seasons: data.seasons?.toString() || "", // ✅ Mapeo de temporadas
        });
        setImagePreviewUrl(data.poster_url || null);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, true);
      handleGoBack();
    } finally {
      setFetchLoading(false);
    }
  }, [id, handleGoBack, showToast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleEstreno = () => {
    setFormData(prev => ({ ...prev, estreno: !prev.estreno }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPosterFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, poster_url: "" }));
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
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw new Error("Error al subir el archivo: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage.from(POSTER_BUCKET).getPublicUrl(filePath);
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

      await api.patch("/api/media", {
        id,
        title: formData.title,
        synopsis: formData.synopsis,
        poster_url: finalPosterUrl || null,
        genre: formData.genre,
        year: parseInt(formData.year) || 0,
        category: formData.category,
        idioma: formData.idioma || null,
        estreno: formData.estreno,
        seasons: showSeasonsField ? (parseInt(formData.seasons) || null) : null, // ✅ Actualización de temporadas
      });

      showToast("¡Contenido actualizado correctamente!", false);
      handleGoBack();

    } catch (err: any) {
      showToast(`Error al actualizar: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 min-h-screen bg-gray-950">
      <div className="mb-8 mt-6">
        <button onClick={handleGoBack} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Volver a Media
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Upload className="w-7 h-7 text-indigo-400" />
          Editar Contenido
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">

        {/* Sección de imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 border-b border-gray-700/50 pb-8">
          <div className="flex flex-col">
            <label className="block text-white font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Vista previa del póster
            </label>
            <div className="relative w-full max-w-[200px] aspect-[2/3] bg-gray-700 rounded-xl overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
              {imagePreviewUrl ? (
                <div className="w-full h-full relative">
                  <Image src={imagePreviewUrl} alt="Poster" fill className="object-cover" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full z-10 hover:bg-red-700 transition-colors">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Sin imagen</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-white font-medium mb-2">Subir nueva imagen</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-indigo-600 file:text-white bg-gray-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">O usar URL externa</label>
              <input type="url" name="poster_url" value={formData.poster_url || ""} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Campos de texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">Título</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-400" /> Idioma
            </label>
            <input type="text" name="idioma" value={formData.idioma || ""} onChange={handleChange} placeholder="Latino, Subtitulado..." className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors" />
          </div>

          <div className="flex flex-col justify-center">
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <Star className={`w-4 h-4 ${formData.estreno ? 'text-amber-400 fill-amber-400' : 'text-gray-500'}`} />
              Marcar como Estreno
            </label>
            <div
              onClick={toggleEstreno}
              className={`relative w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData.estreno ? 'bg-indigo-600' : 'bg-gray-600'}`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${formData.estreno ? 'translate-x-7' : 'translate-x-0'}`} />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Género</label>
            <input type="text" name="genre" value={formData.genre} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Año</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors appearance-none">
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {showSeasonsField && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 md:col-span-2">
              <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Layers className="w-3 h-3 text-indigo-400" /> Cantidad de Temporadas
              </label>
              <input type="number" name="seasons" value={formData.seasons} onChange={handleChange} min="1" placeholder="Ej: 3" className="w-full px-4 py-3 bg-white/5 border border-indigo-500/30 text-white rounded-xl focus:border-indigo-500 outline-none shadow-[0_0_15px_rgba(79,70,229,0.1)]" />
            </div>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-white font-medium mb-2">Sinopsis</label>
          <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={4} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 transition-colors" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700/50">
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-60 w-full sm:w-auto">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Actualizar Contenido
          </button>
          <button type="button" onClick={handleGoBack} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl w-full sm:w-auto transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  );
}