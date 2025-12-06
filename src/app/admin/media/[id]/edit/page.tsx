"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image"; // Usaremos el componente Image de Next.js
import { Upload, Image as ImageIcon, Loader2, X , ArrowLeft} from "lucide-react"; // Iconos

// Define el bucket de Supabase donde se guardarán las imágenes
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

  // --- Lógica de Carga Inicial ---
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

  // --- Manejadores de Estado ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  // --- Lógica de Supabase Storage ---
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
  
  // --- Manejador de Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalPosterUrl = formData.poster_url;

    try {
      if (posterFile) {
        finalPosterUrl = await uploadPoster(posterFile);
        console.log("Nueva URL del póster:", finalPosterUrl);
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

  if (fetchLoading) return <div className="text-center py-8 text-indigo-400"><Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />Cargando datos...</div>;

  return (
    // CAMBIO 1: Ajustar el padding principal en móvil a p-4 y usar max-w-3xl para limitar el ancho en escritorio
    <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-6 bg-gray-950 min-h-screen mt-5">
         <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center shrink-0 mt-4 mb-8"
          title="Volver atrás"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      <h1 className="text-3xl md:text-4xl font-bold text-white border-b border-gray-700 pb-4 mt-4 mb-8">
        Editar Media: {formData.title} 📝
      </h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
        
        {/* Sección de Imagen y Preview */}
        {/* CAMBIO 2: Usar flex-col en móvil y md:grid-cols-2 en escritorio. */}
        {/* Esto apila el preview y el input en móvil. */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
          
          {/* Columna de Preview de Imagen */}
          {/* CAMBIO 3: Ajustar alineación en móvil */}
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
                  No hay póster
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
          
          {/* Columna de Input de Archivo */}
          <div className="space-y-4 order-1 md:order-none">
            <div>
              <label className="block text-white mb-2 font-medium">Subir Nuevo Póster (Archivo)</label>
              <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    // CAMBIO 4: Ajustar el file input para que no fuerce un ancho fijo
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 transition-colors bg-gray-700 text-white rounded-lg p-1 w-full"
                  />
              </div>
              <p className="text-xs text-gray-400 mt-1">Selecciona una imagen si deseas reemplazar el póster.</p>
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

        {/* Campos de Texto, Selección, etc. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
            {/* Los inputs ya son w-full, así que en móvil se apilan bien. */}
            <div>
              <label className="block text-white mb-2">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Género</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            
            {/* Otros campos... (año, categoría) */}
            <div>
              <label className="block text-white mb-2">Año</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Categoría</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
        </div>

        <div>
          <label className="block text-white mb-2">Sinopsis</label>
          <textarea
            name="synopsis"
            value={formData.synopsis}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4"> {/* CAMBIO 5: Apilar botones en móvil (flex-col) */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 font-semibold shadow-lg w-full sm:w-auto" // CAMBIO 6: Ancho completo en móvil
          >
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Actualizando...</> : <><Upload className="w-5 h-5 mr-2" /> Actualizar Media</>}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold w-full sm:w-auto" // CAMBIO 6: Ancho completo en móvil
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}