"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Media } from "@/app/models/media";
import { useToast } from "@/app/context/ToastContext";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Tag,
  Folder,
  Star,
  Search, // Icono nuevo
  X,
  Loader2,      // Icono para limpiar búsqueda
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminMediaPage() {
  const { showToast } = useToast();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Estado para el buscador

  const startIndex = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);
  const endIndex = useMemo(() => startIndex + ITEMS_PER_PAGE, [startIndex]);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 1. Fetch de conteo total (ajustado para búsqueda)
  const fetchTotalCount = useCallback(async () => {
    try {
      let query = supabase.from("media").select("*", { count: "exact", head: true });
      
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      setTotalItems(count || 0);
    } catch (err: any) {
      console.error("Error fetching total count:", err.message);
    }
  }, [searchTerm]);

  // 2. Fetch de Media (ajustado para búsqueda)
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex - 1);

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMedia(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startIndex, endIndex, searchTerm]);

  // 3. Efecto para recargar cuando cambia la página o la búsqueda
  useEffect(() => {
    fetchTotalCount();
    fetchMedia();
  }, [fetchMedia, fetchTotalCount]);

  // Manejador del input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este contenido?")) return;
    try {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
      showToast("Contenido eliminado", false);
      fetchTotalCount();
      fetchMedia();
    } catch (err: any) {
      showToast("Error al eliminar: " + err.message, true);
    }
  };

  const renderEstrenoBadge = (estreno: boolean | null | undefined) => {
    if (estreno === true) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">Sí</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/50 text-gray-400 border border-gray-800/50">No</span>;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 mt-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Responsive */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <Film className="w-6 h-6" />
              </div>
              Administrar Contenido
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Gestiona películas, series y estrenos</p>
          </div>

          {/* ✅ Buscador y Botón Nuevo */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-gray-900/50 border border-gray-700 text-white pl-10 pr-10 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Link
              href="/admin/media/new"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Contenido de la Tabla */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-gray-500">Filtrando resultados...</p>
             </div>
          ) : (
            <>
              {/* Desktop Table (Oculta en móvil) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700/70 bg-gray-800/80">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Año</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> Estreno</div></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40">
                    {media.length > 0 ? (
                      media.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{item.title}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">{item.category}</span>
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-semibold">{item.year}</td>
                          <td className="px-6 py-4">{renderEstrenoBadge(item.estreno)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Link href={`/admin/media/${item.id}/edit`} className="p-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white transition-all"><Edit2 className="w-4 h-4" /></Link>
                              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No se encontraron resultados para "{searchTerm}"</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (Móvil) */}
              <div className="md:hidden p-4 space-y-4">
                {media.length > 0 ? (
                  media.map((item) => (
                    <div key={item.id} className="bg-gray-700/60 rounded-xl p-4 border border-gray-600/50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-white text-lg">{item.title}</h3>
                        {renderEstrenoBadge(item.estreno)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-2"><Folder className="w-4 h-4" />{item.category}</div>
                        <div className="flex items-center gap-2"><Tag className="w-4 h-4" />{item.year}</div>
                      </div>
                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-600/50">
                        <Link href={`/admin/media/${item.id}/edit`} className="p-2 bg-blue-600 rounded-lg text-white"><Edit2 className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-600 rounded-lg text-white"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm">Sin resultados</div>
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={Math.min(endIndex, totalItems)}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// --- Componente de Paginación ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-700/50 gap-4">
      <div className="text-sm text-gray-400">
        Mostrando <span className="font-semibold text-white">{startIndex + 1}</span> a{" "}
        <span className="font-semibold text-white">{endIndex}</span> de{" "}
        <span className="font-semibold text-white">{totalItems}</span> elementos
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="px-4 py-2 bg-indigo-600/20 text-indigo-300 font-medium rounded-lg">
          {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};