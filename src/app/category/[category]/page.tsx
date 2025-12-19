"use client";

import { getAllMedia } from "@/app/actions/media.actions"; 
import { Media } from "@/app/models/media";
import MediaCard from "@/components/MediaCard";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";

type MediaWithRating = Media & { avg_rating: number; }
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => (2025 - i).toString());
const GENRE_OPTIONS = ["Acción", "Comedia", "Drama", "Terror", "Sci-Fi", "Documental", "Animación"];

// =================================================================
// CARRUSEL PREMIUM
// =================================================================
const TopRecentCarousel = ({ media }: { media: MediaWithRating[] }) => (
  <section className="mb-12">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Agregados <span className="text-[var(--color-primary)]">Recientemente</span></h2>
    </div>
    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x">
      {media.map((m) => (
        <motion.div key={m.id} whileHover={{ y: -8 }} className="flex-shrink-0 w-40 sm:w-48 snap-start group">
          <div className="relative aspect-[2/3] rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl bg-[#1a1a1a]">
            <img
              src={m.poster_url || "https://placehold.co/300x450/161616/DCDAD9?text=Sin+Poster"}
              alt={m.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center backdrop-blur-md bg-white/10 p-2 rounded-xl border border-white/10">
              <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-tighter text-shadow-sm">Rating</span>
              <span className="text-xs font-bold text-white">★ {m.avg_rating?.toFixed(1) || "N/A"}</span>
            </div>
          </div>
          <h3 className="mt-3 text-sm font-bold text-[var(--color-secondary)] truncate px-1 group-hover:text-[var(--color-primary)] transition-colors">
            {m.title}
          </h3>
        </motion.div>
      ))}
    </div>
  </section>
);

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function CategoryPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extraemos la categoría de forma segura
  const categoryParam = useMemo(() => pathname.split('/').pop() || '', [pathname]);

  const [allMedia, setAllMedia] = useState<MediaWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentYear = searchParams.get('year') || '';
  const currentGenre = searchParams.get('genre') || '';

useEffect(() => {
  let active = true;

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllMedia();
      if (active) setAllMedia(data);
    } catch (error) {
      console.error(error);
    } finally {
      if (active) setLoading(false);
    }
  };

  fetchData();
  return () => { active = false; };
}, [categoryParam]); // Esto disparará la carga optimizada cada vez que cambies de categoría

  const categoryMedia = useMemo(() => {
    if (!categoryParam || allMedia.length === 0) return [];
    
    let filtered = allMedia.filter(m => normalizeText(m.category) === normalizeText(categoryParam));
    
    if (currentYear) filtered = filtered.filter(m => m.year?.toString() === currentYear);
    if (currentGenre) filtered = filtered.filter(m => normalizeText(m.genre).includes(normalizeText(currentGenre)));
    
    return filtered;
  }, [allMedia, categoryParam, currentYear, currentGenre]);

  const top5Recent = useMemo(() => {
    return [...categoryMedia]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 8);
  }, [categoryMedia]);

  const handleApplyFilters = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.year) params.set('year', filters.year); else params.delete('year');
    if (filters.genre) params.set('genre', filters.genre); else params.delete('genre');
    router.push(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div 
      className="min-h-screen bg-[#161616ff] text-[#DCDAD9]"
      style={{"--color-primary": "#F9C3A4", "--color-secondary": "#DCDAD9", "--color-accent": "#95999E"} as any}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        
        <motion.div key={categoryParam} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-6xl font-black text-white capitalize tracking-tighter italic">
            {categoryParam.replace(/-/g, ' ')}
          </h1>
          <div className="h-1 w-20 bg-[var(--color-primary)] mt-2 rounded-full shadow-[0_0_15px_rgba(249,195,164,0.4)]" />
        </motion.div>

        {top5Recent.length > 0 && <TopRecentCarousel media={top5Recent} />}

        <hr className="my-10 border-white/5" />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block">
            <FilterSidebar
              singleSelects={[
                { key: "year", label: "Año", value: currentYear, options: [{value: "", label: "Todos"}, ...YEAR_OPTIONS.map(y => ({value:y, label:y}))] },
                { key: "genre", label: "Género", value: currentGenre, options: [{value: "", label: "Todos"}, ...GENRE_OPTIONS.map(g => ({value:g, label:g}))] }
              ]}
              onApply={handleApplyFilters}
              onReset={() => router.push(pathname)}
            />
          </div>

          <div className="lg:hidden flex justify-end mb-4">
            <button onClick={() => setIsFilterOpen(true)} className="px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 text-xs font-black uppercase">
              Filtros
            </button>
          </div>

          <main className="flex-1">
            <AnimatePresence mode="wait">
              {categoryMedia.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                  <p className="text-[var(--color-accent)] font-medium italic">No se encontraron títulos en esta sección.</p>
                </motion.div>
              ) : (
                <motion.div key="grid" layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                  {categoryMedia.map((item) => (
                    <MediaCard key={item.id} media={item} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {isFilterOpen && (
        <FilterSidebar
          singleSelects={[
            { key: "year", label: "Año", value: currentYear, options: [{value: "", label: "Todos"}, ...YEAR_OPTIONS.map(y => ({value:y, label:y}))] },
            { key: "genre", label: "Género", value: currentGenre, options: [{value: "", label: "Todos"}, ...GENRE_OPTIONS.map(g => ({value:g, label:g}))] }
          ]}
          onApply={handleApplyFilters}
          onReset={() => { router.push(pathname); setIsFilterOpen(false); }}
          isMobile={true}
          onCloseMobile={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#161616ff] px-4 pt-32 max-w-7xl mx-auto">
      <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse mb-12" />
      <div className="flex gap-10">
        <div className="hidden lg:block w-48 h-80 bg-white/5 rounded-2xl animate-pulse" />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}