"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { Loader2, X,ArrowLeft,Plus, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";


// Define el bucket de Supabase donde se guardarán las imágenes
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
};

export default function CreateMediaPage() {
  const router = useRouter();
  // Obtener la función global showToast
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // ELIMINAMOS: los estados locales 'message' e 'isError'
  
  // Limpieza de URL de objeto (mantenemos solo la lógica de revocación de Blob URL)
  useEffect(() => {
    // Si la URL es una URL temporal de Blob, la revocamos al desmontar o cambiar la preview.
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);


  // --- Manejadores de Estado (Sin cambios) ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    } else {
      setPosterFile(null);
      setImagePreviewUrl(null);
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

  // --- Lógica de Supabase Storage (Subida sin cambios) ---

  const uploadPoster = async (file: File, newRecordId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${newRecordId}.${fileExt}`;
    const filePath = `${fileName}`; 

    const { error: uploadError } = await supabase.storage
      .from(POSTER_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      throw new Error("Error al subir el archivo: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(POSTER_BUCKET)
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  };
  
  // --- Manejador de Submit (MODIFICADO para usar useToast) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insertar registro
      const { data: insertedData, error: insertError } = await supabase
        .from("media")
        .insert({
          title: formData.title,
          synopsis: formData.synopsis,
          poster_url: formData.poster_url || null,
          genre: formData.genre,
          year: parseInt(formData.year),
          category: formData.category,
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // 2. Subir imagen y actualizar registro si existe archivo
      if (posterFile) {
        const finalPosterUrl = await uploadPoster(posterFile, insertedData.id);
        
        const { error: updateError } = await supabase
          .from("media")
          .update({ poster_url: finalPosterUrl })
          .eq("id", insertedData.id);
          
        if (updateError) throw updateError;
      }
      
      // USAR TOAST GLOBAL PARA ÉXITO
      // El segundo parámetro (false) indica que NO es un error. 
      // El tercer parámetro (2000ms) es la duración del toast.
      showToast(`Media "${formData.title}" creado exitosamente.`, false, 2000);
      
      // Redirección después de un breve tiempo para que el usuario vea el toast
      setTimeout(() => {
        router.push("/admin/media");
      }, 1000); 
      
    } catch (err: any) {
      // USAR TOAST GLOBAL PARA ERROR (y permanecer en la vista)
      // El segundo parámetro (true) indica que ES un error. 
      showToast(`ERROR al crear media: ${err.message}`, true, 5000);
      console.error(err);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-6 bg-gray-950 min-h-screen">
         <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center shrink-0 mt-4 mb-8"
          title="Volver atrás"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      <h1 className="text-4xl font-bold text-white border-b border-gray-700 pb-4">
        Crear Nuevo Media ➕
      </h1>

      {/* !!! ELIMINAMOS EL BLOQUE DE NOTIFICACIÓN LOCAL !!! */}

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
        {/* Resto del formulario (Imagen, inputs, etc.) sin cambios */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
          {/* Columna de Preview de Imagen */}
           <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col items-center justify-center border border-gray-700 order-2 md:order-none">
            <label className="block text-white text-lg font-semibold mb-3">Preview del Póster</label>
            <div className="relative w-48 h-64 bg-gray-600 rounded-lg overflow-hidden border-2 border-indigo-500/50 shadow-lg">
              {imagePreviewUrl ? (
                <Image
                  src={imagePreviewUrl}
                  alt="Poster Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  Póster
                </div>
              )}
              {imagePreviewUrl && (
                <button 
                  type="button" 
                  onClick={handleRemoveImage} 
                  title="Eliminar imagen"
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded-full text-white shadow-lg transition-transform hover:scale-110 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Columna de Input de Archivo/URL */}
          <div className="space-y-4 order-1 md:order-none">
            <div>
              <label className="block text-white mb-2 font-medium">Subir Póster (Archivo)</label>
              <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 transition-colors bg-gray-700 text-white rounded-lg p-1 w-full"
                  />
              </div>
              <p className="text-xs text-gray-400 mt-1">Selecciona una imagen para subir.</p>
            </div>
            
            {/* Input URL del Póster */}
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-white mb-2 font-medium">O usar URL externa (Opción Manual)</label>
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
                className={`w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${!!posterFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="https://ejemplo.com/poster.jpg"
              />
               <p className="text-xs text-gray-400 mt-1">Este campo se deshabilita si seleccionas un archivo local.</p>
            </div>
          </div>
        </div>

        {/* CAMPOS DE TEXTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Título</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-white mb-2">Género</label>
              <input type="text" name="genre" value={formData.genre} onChange={handleChange} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-white mb-2">Año</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} min="1900" max={new Date().getFullYear() + 1} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-white mb-2">Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
        </div>

        <div>
          <label className="block text-white mb-2">Sinopsis</label>
          <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={4} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 font-semibold shadow-lg w-full sm:w-auto"
          >
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creando...</> : <><Plus className="w-5 h-5 mr-2" /> Crear Media</>}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold w-full sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}