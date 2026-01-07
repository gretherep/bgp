"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllMedia } from "@/app/actions/media.actions";
import { Media } from "@/app/models/media";
import MediaCard from "@/components/MediaCard";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";
import Link from "next/link";
import ShootingStars from "@/components/ShootingStars";
import { genreOptions } from "@/utils/filter-options";
import { Film, Tv, JapaneseYen, Clapperboard, Tent } from "lucide-react";

type MediaWithRating = Media & { avg_rating: number };

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - i).toString());

const MOVIE_SUBTYPES = [
  { value: "todo", label: "Todo" },
  { value: "pelicula", label: "Películas" },
  { value: "animada", label: "Animadas" },
];

const CategoryIcon = ({ category }: { category: string }) => {
  const icons: Record<string, React.ElementType> = {
    peliculas: Film,
    series: Tv,
    anime: JapaneseYen,
    novelas: Clapperboard,
    reality: Tent,
  };
  const IconComponent = icons[normalizeText(category)] || Film;
  return (
    <motion.div 
      animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
    >
      <IconComponent size={200} strokeWidth={0.5} className="text-[var(--color-primary)]" />
    </motion.div>
  );
};

export default function CategoryPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allMedia, setAllMedia] = useState<MediaWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categoryParam = useMemo(() => pathname.split("/").pop() || "", [pathname]);
  
  // Extraer valores de la URL
  const currentYear = searchParams.get("year") || "";
  const currentSubtype = searchParams.get("subtype") || "todo";
  const currentGenres = useMemo(() => searchParams.get("genre")?.split(",").filter(Boolean) ?? [], [searchParams]);

  // --- CONFIGURACIÓN DE FILTROS MEMOIZADA (Evita bucles infinitos) ---
  const filterConfig = useMemo(() => {
    const years = [{ value: "", label: "Todos" }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))];
    return {
      segmented: categoryParam === "peliculas" 
        ? [{ key: "subtype", label: "Contenido", value: currentSubtype, options: MOVIE_SUBTYPES }] 
        : [],
      single: [{ key: "year", label: "Año", value: currentYear, options: years }],
      multi: [{ key: "genre", label: "Géneros", value: currentGenres, options: genreOptions }]
    };
  }, [categoryParam, currentSubtype, currentYear, currentGenres]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllMedia();
        if (active) setAllMedia(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [categoryParam]);

  const categoryMedia = useMemo(() => {
    let filtered = allMedia.filter((m) => {
      const mediaCat = normalizeText(m.category);
      const urlCat = normalizeText(categoryParam);
      if (urlCat === "peliculas") return mediaCat.includes("pelicula");
      return mediaCat === urlCat;
    });

    if (categoryParam === "peliculas" && currentSubtype !== "todo") {
      if (currentSubtype === "animada") filtered = filtered.filter(m => normalizeText(m.category).includes("animada"));
      else if (currentSubtype === "pelicula") filtered = filtered.filter(m => !normalizeText(m.category).includes("animada"));
    }
    if (currentYear) filtered = filtered.filter(m => m.year?.toString() === currentYear);
    if (currentGenres.length > 0) {
      filtered = filtered.filter(m => currentGenres.some(g => normalizeText(m.genre).includes(normalizeText(g))));
    }
    return filtered;
  }, [allMedia, categoryParam, currentYear, currentGenres, currentSubtype]);

  const topRecent = useMemo(() => {
    return [...categoryMedia]
      .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
      .slice(0, 10);
  }, [categoryMedia]);

  const handleApplyFilters = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.subtype && filters.subtype !== "todo") params.set("subtype", filters.subtype); else params.delete("subtype");
    if (filters.year) params.set("year", filters.year); else params.delete("year");
    if (filters.genre?.length > 0) params.set("genre", filters.genre.join(",")); else params.delete("genre");
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
      
      <section className="relative w-full pt-32 pb-16 overflow-hidden">
        <ShootingStars />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[120px] animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-bold tracking-widest uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full border border-[var(--color-primary)]/20">
              Explorando Categoría
            </span>
            <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter leading-none italic uppercase">
              {categoryParam.replace(/-/g, " ")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[#f9c3a4] to-white">
                Premium.
              </span>
            </h1>
          </motion.div>
          <CategoryIcon category={categoryParam} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 pb-20">
        
        {topRecent.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full shadow-[0_0_10px_rgba(249,195,164,0.5)]" />
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Estrenos de la semana</h2>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x">
              {topRecent.map(m => (
                <div key={m.id} className="flex-shrink-0 w-40 md:w-48 snap-start">
                  <MediaCard media={m} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-12 mt-10">
          <aside className="hidden lg:block shrink-0">
            <div className="sticky top-32">
              <FilterSidebar 
                segmentedFilters={filterConfig.segmented}
                singleSelects={filterConfig.single}
                multiSelects={filterConfig.multi}
                onApply={handleApplyFilters}
                onReset={() => router.push(pathname)}
              />
            </div>
          </aside>

          <main className="flex-1">
            <div className="lg:hidden flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-2">
                {/* BOTÓN FILTRO MÓVIL CON BADGE */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-black shadow-lg active:scale-95 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/center" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                  </svg>
                </button>

                <div className="flex-1 flex overflow-x-auto gap-2 no-scrollbar">
                  {["Películas", "Series", "Anime", "Novelas", "Reality"].map(name => (
                    <Link 
                      key={name} 
                      href={`/category/${name.toLowerCase()}`}
                      className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap border ${normalizeText(categoryParam) === normalizeText(name) ? 'bg-white/10 border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 opacity-50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{categoryMedia.length} Títulos</span>
              <div className="h-px flex-1 mx-4 bg-white/5" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={categoryParam + currentSubtype + currentYear}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              >
                {categoryMedia.map(item => <MediaCard key={item.id} media={item} />)}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* MODAL MÓVIL */}
      <AnimatePresence>
        {isFilterOpen && (
          <FilterSidebar 
            isMobile 
            onCloseMobile={() => setIsFilterOpen(false)}
            segmentedFilters={filterConfig.segmented}
            singleSelects={filterConfig.single}
            multiSelects={filterConfig.multi}
            onApply={handleApplyFilters}
            onReset={() => {
              router.push(pathname);
              setIsFilterOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}