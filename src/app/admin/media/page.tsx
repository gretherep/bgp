"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Media } from "@/app/models/media";
import { useToast } from "@/app/context/ToastContext";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Search,
  X,
  Loader2,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminMediaPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Estados iniciales sincronizados con la URL (Solo al montar el componente)
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Leemos valores de la URL directamente para usarlos en las consultas
  const currentPage = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 2. Función para actualizar la URL (Solo se llama en eventos de usuario)
  const createQueryString = useCallback(
    (page: number, search: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      return params.toString();
    },
    [searchParams]
  );

  // 3. Carga de datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Consulta de conteo
      let countQuery = supabase.from("media").select("*", { count: "exact", head: true });
      if (searchTerm) countQuery = countQuery.ilike("title", `%${searchTerm}%`);
      const { count } = await countQuery;
      setTotalItems(count || 0);

      // Consulta de datos
      let dataQuery = supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (searchTerm) dataQuery = dataQuery.ilike("title", `%${searchTerm}%`);

      const { data, error } = await dataQuery;
      if (error) throw error;
      setMedia(data || []);
    } catch (err: any) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [startIndex, searchTerm]);

  // 4. Efecto: Solo carga datos cuando la URL cambia
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- MANEJADORES DE EVENTOS (Aquí es donde actualizamos la URL) ---

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Al buscar, reiniciamos a página 1 en la URL
    router.push(`${pathname}?${createQueryString(1, value)}`);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      router.push(`${pathname}?${createQueryString(page, searchTerm)}`);
    }
  };

  const clearSearch = () => {
    router.push(`${pathname}?${createQueryString(1, "")}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este contenido?")) return;
    try {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
      showToast("Contenido eliminado", false);
      fetchData();
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
        
        {/* Header con Buscador */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <Film className="w-6 h-6" />
              </div>
              Administrar Contenido
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-gray-900/50 border border-gray-700 text-white pl-10 pr-10 py-2.5 rounded-xl focus:border-indigo-500 transition-all outline-none text-sm"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Link href="/admin/media/new" className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-amber-500 text-white font-medium px-4 py-2.5 rounded-xl w-full sm:w-auto">
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Tabla / Lista */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
               
             </div>
          ) : (
            <>
              {/* Vista Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700/70 bg-gray-800/80 text-gray-400 text-xs uppercase font-semibold">
                      <th className="px-6 py-4 text-left">Título</th>
                      <th className="px-6 py-4 text-left">Categoría</th>
                      <th className="px-6 py-4 text-left">Año</th>
                      <th className="px-6 py-4 text-left text-amber-400">Estreno</th>
                      <th className="px-6 py-4 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40 text-white">
                    {media.length > 0 ? (
                      media.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                          <td className="px-6 py-4 font-medium">{item.title}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">{item.category}</span>
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-semibold">{item.year}</td>
                          <td className="px-6 py-4">{renderEstrenoBadge(item.estreno)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Link 
  href={`/admin/media/${item.id}/edit?returnPage=${currentPage}${searchTerm ? `&returnSearch=${encodeURIComponent(searchTerm)}` : ''}`} 
  className="p-2 rounded-lg bg-blue-600/90 text-white hover:bg-blue-600"
>
  <Edit2 className="w-4 h-4" />
</Link>
                              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-600/90 text-white hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil */}
              <div className="md:hidden p-4 space-y-4">
                {media.map((item) => (
                  <div key={item.id} className="bg-gray-700/60 rounded-xl p-4 border border-gray-600/50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white">{item.title}</h3>
                      {renderEstrenoBadge(item.estreno)}
                    </div>
                    <div className="flex gap-4 text-[10px] text-gray-400 uppercase mb-4">
                      <span>{item.category}</span>
                      <span>{item.year}</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-600/50">
                      <Link href={`/admin/media/${item.id}/edit`} className="p-2 bg-blue-600 rounded-lg text-white"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-600 rounded-lg text-white"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-700/50 gap-4">
                <div className="text-xs text-gray-400">
                  Mostrando <span className="text-white font-bold">{startIndex + 1}</span> a <span className="text-white font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span> de <span className="text-white font-bold">{totalItems}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-2 rounded-lg bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-5 h-5 text-white" /></button>
                  <span className="px-4 py-2 bg-indigo-600/20 text-indigo-300 font-bold rounded-lg text-sm">{currentPage} / {totalPages || 1}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-2 rounded-lg bg-gray-700 disabled:opacity-30"><ChevronRight className="w-5 h-5 text-white" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}