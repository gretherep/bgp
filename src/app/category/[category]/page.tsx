"use client";

import { getAllMedia } from "@/app/actions/media.actions"; 
import { Media } from "@/app/models/media";
import MediaCard from "@/components/MediaCard";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar"; // ✅ Importa el componente

// =================================================================
// DATOS MOCK PARA FILTROS
// =================================================================
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => (2025 - i).toString());

const GENRE_OPTIONS = [
  "Acción", "Comedia", "Drama", "Terror", "Sci-Fi", "Documental", "Animación"
];

// =================================================================
// TIPO
// =================================================================
type MediaWithRating = Media & {
  avg_rating: number;
}

// =================================================================
// CARRUSEL SIMPLIFICADO
// =================================================================
const TopRecentCarousel = ({ media }: { media: MediaWithRating[] }) => (
  <section className="mb-10">
    <div className="flex items-center mb-5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-[var(--color-primary)] mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.55-4.55a.8.8 0 011.12 0l.33.33a.8.8 0 010 1.12L16.4 11.4l-4.7 4.7a.8.8 0 01-1.12 0l-.33-.33a.8.8 0 010-1.12L13.6 11.4l1.4-1.4zM3 15v5a2 2 0 002 2h14a2 2 0 002-2v-5M3 9V4a2 2 0 012-2h14a2 2 0 012 2v5"
        />
      </svg>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-secondary)]">Más Recientes</h2>
    </div>

    {media.length === 0 ? (
      <p className="text-[var(--color-accent)] italic">No hay títulos recientes en esta categoría.</p>
    ) : (
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {media.map((m) => (
          <div key={m.id} className="flex-shrink-0 w-36 sm:w-40">
            <div className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer group">
              <img
                src={m.poster_url || "https://placehold.co/150x230/1f2937/FFF?text=No+Poster"}
                alt={m.title}
                className="w-full h-52 object-cover transition-opacity duration-300 group-hover:opacity-90"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/150x230/1f2937/FFF?text=No+Poster"; }}
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <div className="flex items-center space-x-0.5">
                {"★".repeat(Math.round(m.avg_rating || 0))}
                {"☆".repeat(5 - Math.round(m.avg_rating || 0))}
              </div>
              <p className="text-xs text-[var(--color-accent)] mt-1">
                ({m.avg_rating ? m.avg_rating.toFixed(1) : "–"})
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
interface CategoryPageProps {
  params: { category: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = pathname.split('/').pop() || '';

  const [allMedia, setAllMedia] = useState<MediaWithRating[]>(([]));
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const initialYear = searchParams.get('year') || '';
  const initialGenre = searchParams.get('genre') || '';
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentGenre, setCurrentGenre] = useState(initialGenre);
  
  // Estado para el panel de filtros móvil
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (!categoryParam) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllMedia();
        setAllMedia(data as MediaWithRating[]);
      } catch (error) {
        console.error("Error al cargar medios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryParam]);

  useEffect(() => {
    setCurrentYear(searchParams.get('year') || '');
    setCurrentGenre(searchParams.get('genre') || '');
  }, [searchParams]);

  const categoryMedia = useMemo(() => {
    if (loading || !categoryParam) return [];
    
    let filtered = allMedia.filter(
      m => normalizeText(m.category) === normalizeText(categoryParam)
    );

    const filterYear = searchParams.get('year');
    const filterGenre = searchParams.get('genre');

    if (filterYear) {
      filtered = filtered.filter(m => m.year?.toString() === filterYear);
    }
    if (filterGenre) {
      filtered = filtered.filter(m => normalizeText(m.genre).includes(normalizeText(filterGenre)));
    }

    return filtered;
  }, [allMedia, loading, categoryParam, searchParams]);

  const top5Recent = useMemo(() => {
    return categoryMedia
      .filter(m => m.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [categoryMedia]);

  // ✅ HANDLERS PARA EL COMPONENTE FILTROS
 const handleApplyFilters = (filters: Record<string, string | string[]>) => {
    const newParams = new URLSearchParams();
    if (filters.year) newParams.set('year', filters.year as string);
    if (filters.genre) newParams.set('genre', filters.genre as string);
    router.push(`${pathname}?${newParams.toString()}`);
    setIsFilterOpen(false); // ✅ Cerrar panel en móvil
  };

  const handleResetFilters = () => {
    router.push(pathname);
    setIsFilterOpen(false); // ✅ Cerrar panel en móvil
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div 
            className="animate-pulse h-8 w-64 rounded mb-10"
            style={{ backgroundColor: 'rgba(149, 153, 158, 0.2)' }}
          ></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-[2/3] rounded-lg"
                style={{ backgroundColor: 'rgba(149, 153, 158, 0.2)' }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categoryParam) {
    return (
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: 'rgba(249, 195, 164, 0.1)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(249, 195, 164, 0.3)'
        }}
      >
        Error: Categoría no especificada
      </div>
    );
  }

  // ✅ PREPARAR LAS OPCIONES PARA EL COMPONENTE
  const yearOptions = YEAR_OPTIONS.map(year => ({ 
    value: year, 
    label: year 
  }));

  const genreOptions = GENRE_OPTIONS.map(genre => ({ 
    value: genre, 
    label: genre 
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <h1 className="text-2xl sm:text-3xl font-bold capitalize mb-2 mt-12">
          {categoryParam.replace(/-/g, ' ')}
        </h1>

        {top5Recent.length > 0 && <TopRecentCarousel media={top5Recent} />}

        <hr 
          className="my-6"
          style={{ borderColor: 'rgba(149, 153, 158, 0.2)' }}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 🖥️ FILTROS SOLO EN DESKTOP (oculto en móvil) */}
          <div className="hidden lg:block">
            <FilterSidebar
              singleSelects={[
                { key: "year", label: "Año", value: currentYear, options: [{value: "", label: "Todos los años"}, ...yearOptions] },
                { key: "genre", label: "Género", value: currentGenre, options: [{value: "", label: "Todos los géneros"}, ...genreOptions] }
              ]}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </div>

          {/* 📱 BOTÓN DE FILTROS SOLO EN MÓVIL */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2 rounded-full flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(249, 195, 164, 0.15)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(249, 195, 164, 0.3)'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
              </svg>
              <span className="text-xs font-medium">Filtros</span>
            </button>
          </div>

          {/* 📺 CONTENIDO PRINCIPAL */}
          <main className="flex-1">
            {categoryMedia.length === 0 ? (
              <p 
                className="text-lg p-6 rounded-lg text-center"
                style={{ 
                  backgroundColor: 'rgba(149, 153, 158, 0.1)',
                  color: 'var(--color-accent)',
                  border: '1px solid rgba(149, 153, 158, 0.2)'
                }}
              >
                No se encontraron títulos en esta categoría con los filtros aplicados.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {categoryMedia.map((item) => (
                  <MediaCard key={item.id} media={item} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 📱 PANEL DE FILTROS MÓVIL (solo cuando está abierto) */}
      {isFilterOpen && (
        <FilterSidebar
          singleSelects={[
            { key: "year", label: "Año", value: currentYear, options: [{value: "", label: "Todos los años"}, ...yearOptions] },
            { key: "genre", label: "Género", value: currentGenre, options: [{value: "", label: "Todos los géneros"}, ...genreOptions] }
          ]}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          isMobile={true}
          onCloseMobile={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
}

// =================================================================
// FUNCIÓN DE UTILIDAD
// =================================================================
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}