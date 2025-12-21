"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { Loader2, X, ArrowLeft, Plus, ImageIcon, Star, Languages } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";

const POSTER_BUCKET = "posters";

const categories = [
  "Películas", "Series", "Novelas", "Reality Shows", "MiniSeries",
  "Series Animadas", "Películas Animadas", "Anime", "Películas Anime",
];

const initialFormData = {
  title: "",
  synopsis: "",
  poster_url: "",
  genre: "",
  year: new Date().getFullYear().toString(),
  category: "",
  idioma: "",    // ✅ Nuevo campo
  estreno: false, // ✅ Nuevo campo
};

export default function CreateMediaPage() {
  const router = useRouter();
  const { showToast } = useToast(); // ✅ Hook de Toast listo

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Función para el Switch de Estreno
  const toggleEstreno = () => {
    setFormData(prev => ({ ...prev, estreno: !prev.estreno }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setPosterFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, poster_url: "" }));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setPosterFile(null);
    setImagePreviewUrl(null);
    setFormData((prev) => ({ ...prev, poster_url: "" }));
  };

  const uploadPoster = async (file: File, newRecordId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${newRecordId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(POSTER_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from(POSTER_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insertar datos iniciales (incluyendo los nuevos campos)
      const { data: insertedData, error: insertError } = await supabase
        .from("media")
        .insert({
          title: formData.title,
          synopsis: formData.synopsis,
          poster_url: formData.poster_url || null,
          genre: formData.genre,
          year: parseInt(formData.year),
          category: formData.category,
          idioma: formData.idioma, // ✅ Nuevo
          estreno: formData.estreno, // ✅ Nuevo
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Si hay archivo, subirlo y actualizar el registro
      if (posterFile) {
        const finalPosterUrl = await uploadPoster(posterFile, insertedData.id);
        const { error: updateError } = await supabase
          .from("media")
          .update({ poster_url: finalPosterUrl })
          .eq("id", insertedData.id);

        if (updateError) throw updateError;
      }

      // ✅ Feedback de Éxito con Toast
      showToast(`"${formData.title}" se ha creado correctamente`, false);
      
      // Pequeño delay para que el usuario vea el éxito antes de redirigir
      setTimeout(() => router.push("/admin/media"), 1500);

    } catch (err: any) {
      // ❌ Feedback de Error con Toast
      showToast(err.message || "Ocurrió un error al crear el contenido", true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 min-h-screen bg-gray-950">
      <div className="mb-8 mt-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver a Media
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Plus className="w-7 h-7 text-indigo-400" /> Crear Nuevo Contenido
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">
        
        {/* Sección de imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 border-b border-gray-700/50 pb-8">
          <div className="flex flex-col">
            <label className="block text-white font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" /> Vista previa
            </label>
            <div className="relative w-full max-w-[200px] aspect-[2/3] bg-gray-700 rounded-xl overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
              {imagePreviewUrl ? (
                <div className="w-full h-full relative">
                  <Image src={imagePreviewUrl} alt="Preview" fill className="object-cover" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full"><X className="w-4 h-4 text-white" /></button>
                </div>
              ) : (
                <div className="text-center text-gray-500"><ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" /><p className="text-xs">Sin póster</p></div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Subir archivo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-indigo-600 file:text-white bg-gray-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">O URL directa</label>
              <input type="url" name="poster_url" value={formData.poster_url} onChange={handleChange} disabled={!!posterFile} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Campos de texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">Título</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500" />
          </div>

          {/* ✅ Nuevo: Idioma */}
          <div>
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-400" /> Idioma
            </label>
            <input type="text" name="idioma" value={formData.idioma} onChange={handleChange} placeholder="Ej: Latino, Subtitulado" className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500" />
          </div>

          {/* ✅ Nuevo: Estreno (Switch) */}
          <div className="flex flex-col justify-center">
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <Star className={`w-4 h-4 ${formData.estreno ? 'text-amber-400 fill-amber-400' : 'text-gray-500'}`} /> Marcar como Estreno
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
            <input type="text" name="genre" value={formData.genre} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500" />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Año</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500 appearance-none">
              <option value="" disabled>Seleccionar categoría</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-white font-medium mb-2">Sinopsis</label>
          <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={4} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-indigo-500" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700/50">
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-60 w-full sm:w-auto">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Crear Contenido
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl w-full sm:w-auto">Cancelar</button>
        </div>
      </form>
    </div>
  );
}