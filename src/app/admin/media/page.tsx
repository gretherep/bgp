"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Media } from "@/app/models/media";
import Link from "next/link";
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, List } from "lucide-react";

const ITEMS_PER_PAGE = 10;

// --- Componente Principal: AdminMediaPage ---

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const startIndex = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);
  const endIndex = useMemo(() => startIndex + ITEMS_PER_PAGE - 1, [startIndex]);

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
      if (totalItems === 0) {
        await fetchTotalCount();
      }

      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

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
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este media? Esta acción es irreversible.")) return;

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

  if (loading && media.length === 0) return (
    <div className="text-center py-16 text-xl text-indigo-400 flex justify-center items-center bg-gray-950 min-h-screen">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Cargando datos...
    </div>
  );
  if (error)
    return (
      <div className="text-center py-16 text-xl text-red-500 bg-gray-900 min-h-screen">
        Error al cargar los datos: {error}
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-950 " >
      
      {/* Encabezado y botón de Nuevo Media (MODIFICADO) */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Administrar Media 📝
        </h1>
        <Link
          href="/admin/media/new"
          // Usamos 'group' y p-2 para el padding base (solo icono)
          className="group inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-2 rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 whitespace-nowrap"
          title="Nuevo Media"
        >
          {/* Ícono siempre visible */}
          <Plus className="w-5 h-5" /> 

          {/* Texto: Se muestra solo al pasar el ratón por encima en escritorio. Oculto en móvil. */}
          <span className="hidden sm:inline-block ml-2 group-hover:block">
            Nuevo Media
          </span>
        </Link>
      </header>
      
      {/* Contenedor principal de los datos */}
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
        
        {/* Vista de Escritorio (DataTable) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Género</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Año</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {media.length > 0 ? (
                media.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-700/50 transition duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.genre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/media/${item.id}/edit`}
                        title="Editar"
                        className="inline-flex items-center justify-center p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                        className="inline-flex items-center justify-center p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-gray-400">
                        No hay elementos de media registrados en esta página.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Tarjetas Responsivas) */}
        <div className="sm:hidden p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-300 flex items-center mb-4">
            <List className="w-5 h-5 mr-2" /> Listado (Móvil)
          </h2>
          {media.length > 0 ? (
            media.map((item) => (
              <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white leading-snug">{item.title}</h3>
                  <span className="text-sm font-semibold text-indigo-300 bg-gray-600 px-3 py-1 rounded-full">{item.year}</span>
                </div>
                
                <div className="text-sm text-gray-300 space-y-1 mb-4 border-l-2 border-indigo-500 pl-3">
                  <p><span className="font-medium text-white">Categoría:</span> {item.category}</p>
                  <p><span className="font-medium text-white">Género:</span> {item.genre}</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-600">
                  <Link
                    href={`/admin/media/${item.id}/edit`}
                    title="Editar"
                    className="inline-flex items-center p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Eliminar"
                    className="inline-flex items-center p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center py-6 text-gray-400">
                No hay elementos de media registrados en esta página.
            </div>
          )}
        </div>

        {/* Paginación Integrada */}
        {totalPages > 1 && (
            <PaginationControls 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
            />
        )}

      </div>
      
    </div>
  );
}

// --- Componente de Control de Paginación ---

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationProps> = ({ currentPage, totalPages, totalItems, startIndex, endIndex, onPageChange }) => {
    const actualEndIndex = Math.min(endIndex + 1, totalItems); 
    const actualStartIndex = Math.min(startIndex + 1, actualEndIndex);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-700">
            {/* Información de la paginación */}
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
                Mostrando del 
                <span className="font-semibold text-white mx-1">{actualStartIndex}</span> 
                al 
                <span className="font-semibold text-white mx-1">{actualEndIndex}</span> 
                de 
                <span className="font-semibold text-white mx-1">{totalItems}</span> 
                elementos.
            </div>

            {/* Controles de paginación */}
            <div className="flex space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-400 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Página Anterior"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center px-4 py-2 rounded-lg text-white bg-indigo-600 font-semibold shadow-md">
                    Página {currentPage} de {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg text-gray-400 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Página Siguiente"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};