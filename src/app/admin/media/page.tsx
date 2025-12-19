"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Media } from "@/app/models/media";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  List,
  Film,
  Calendar,
  Tag,
  Folder,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const startIndex = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);
  const endIndex = useMemo(() => startIndex + ITEMS_PER_PAGE, [startIndex]);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const fetchTotalCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("media")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      setTotalItems(count || 0);
    } catch (err: any) {
      console.error("Error fetching total count:", err.message);
    }
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (totalItems === 0) await fetchTotalCount();

      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex - 1);

      if (error) throw error;
      setMedia(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startIndex, endIndex, totalItems, fetchTotalCount]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este contenido? Esta acción es irreversible.")) return;

    try {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;

      await fetchTotalCount();
      const newTotalItems = totalItems - 1;
      const newTotalPages = Math.ceil(newTotalItems / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else {
        fetchMedia();
      }
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  if (loading && media.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
            <p className="text-gray-400">Cargando medias...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 ">
        <div className="bg-gray-800 border border-red-900/50 rounded-xl p-6 max-w-md text-center">
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error al cargar</h3>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 mt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <Film className="w-6 h-6" />
              </div>
              Administrar Contenido
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Gestiona películas, series y más</p>
          </div>

          <Link
            href="/admin/media/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden xs:inline">Nuevo Contenido</span>
          </Link>
        </div>

        {/* Contenedor principal */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700/70 bg-gray-800/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Film className="w-4 h-4" />
                      Título
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Folder className="w-4 h-4" />
                      Categoría
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      Género
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Año
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {media.length > 0 ? (
                  media.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-700/40 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{item.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{item.genre}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-amber-400">{item.year}</span>
                      </td>
                      <td className="px-6 py-4">
                             <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/media/${item.id}/edit`}
                            className="p-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white shadow transition-all duration-200"
                            title="Editar categoría"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow transition-all duration-200"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Film className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                      <p>No hay contenido registrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {media.length > 0 ? (
              media.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white text-lg leading-tight">{item.title}</h3>
                    <span className="text-xs font-bold text-amber-400 bg-amber-900/30 px-2 py-1 rounded">
                      {item.year}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-indigo-400" />
                      <span>
                        <span className="text-gray-400">Categoría:</span>{" "}
                        <span className="font-medium text-white">{item.category}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <span>
                        <span className="text-gray-400">Género:</span>{" "}
                        <span className="font-medium text-white">{item.genre}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-600/50">
                    <Link
                      href={`/admin/media/${item.id}/edit`}
                      className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p>No hay contenido para mostrar</p>
              </div>
            )}
          </div>

          {/* Pagination */}
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