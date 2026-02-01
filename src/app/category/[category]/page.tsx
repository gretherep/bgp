"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/utils/apiClient";
import { Media } from "@/app/models/media";
import MediaCard from "@/components/MediaCard";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";
import ShootingStars from "@/components/ShootingStars";
import LoadingBike from "@/components/LoadingBike";
import Link from "next/link";
import { genreOptions } from "@/utils/filter-options";
import { Film, Tv, JapaneseYen, Clapperboard, Tent, Sparkles } from "lucide-react";

type MediaWithRating = Media & { avg_rating: number };
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - i).toString());

function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
const TopRecentCarousel = ({ media }: { media: MediaWithRating[] }) => (
  <section className="mb-12 mt-10">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
        Agregados <span className="text-[var(--color-primary)]">Recientemente</span>
      </h2>
    </div>

    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x">
      {media.map(m => (
        <motion.div key={m.id} whileHover={{ y: -8 }} className="flex-shrink-0 w-40 sm:w-48 snap-start group">
          <MediaCard media={m} />
        </motion.div>
      ))}
    </div>
  </section>
);

export default function CategoryPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allMedia, setAllMedia] = useState<MediaWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const categoryParam = useMemo(() => pathname?.split("/").pop() || "", [pathname]);
  const currentYear = searchParams.get("year") || "";
  const currentGenres = useMemo(() => searchParams.get("genre")?.split(",").filter(Boolean) ?? [], [searchParams]);

  // Badge de filtros activos
  const hasActiveFilters = currentYear !== "" || currentGenres.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/media?category=${categoryParam}`);
        setAllMedia(response.data || []);
      } catch (err) {
        console.error("Error fetching media:", err);
        setAllMedia([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryParam]);

  const categoryMedia = useMemo(() => {
    if (!allMedia.length) return [];

    const filtered = allMedia.filter((m) => {
      // Note: Category filtering is now done in the backend, but we keep the other filters here

      // 2. Filtro de Año
      if (currentYear && m.year?.toString() !== currentYear) return false;

      // 3. FILTRO DE GÉNEROS (CORREGIDO)
      if (currentGenres.length > 0) {
        const mediaGenresArray = m.genre
          ? normalizeText(m.genre).split(/[- ,]+/)
          : [];

        const hasMatch = currentGenres.some(g =>
          mediaGenresArray.includes(normalizeText(g))
        );

        if (!hasMatch) return false;
      }

      return true;
    });

    // 4. Ordenamiento
    return filtered.sort((a, b) => {
      if (a.estreno === b.estreno) {
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      }
      return a.estreno ? -1 : 1;
    });
  }, [allMedia, currentYear, JSON.stringify(currentGenres)]);

  const top5Recent = useMemo(() => {
    return [...categoryMedia]
      .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
      .slice(0, 8);
  }, [categoryMedia]);

  const handleApplyFilters = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.year) params.set("year", filters.year);
    if (filters.genre?.length > 0) params.set("genre", filters.genre.join(","));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  if (!mounted || loading) return <LoadingBike />;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[var(--color-secondary)] overflow-x-hidden">

      {/* Header Estilo Home */}
      <section className="relative w-full pt-32 pb-8 overflow-hidden">
        <ShootingStars />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md border border-[var(--color-primary)]/20">
              Categoría
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter leading-none italic uppercase text-white">
              {categoryParam.replace(/-/g, " ")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[#f9c3a4] to-white">
                Catálogo
              </span>
            </h1>
          </motion.div>
          {top5Recent.length > 0 && <TopRecentCarousel media={top5Recent} />}

        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* NAVEGACIÓN MÓVIL Y BOTÓN FILTRO (Misma onda que Home) */}
        <div className="lg:hidden flex flex-col mb-10">
          <div className="flex items-center gap-2 w-full">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-black shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                </svg>
              </button>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e] border-2 border-[#161214]"></span>
                </span>
              )}
            </div>

            <div className="flex-1 flex overflow-x-auto gap-2 no-scrollbar">
              {[
                { name: "Películas", href: "/category/peliculas" },
                { name: "Animados", href: "/category/animados" },
                { name: "Series", href: "/category/series" },
                { name: "Anime", href: "/category/anime" },
                { name: "Novelas", href: "/category/novelas" },
                { name: "Reality", href: "/category/reality" },
              ].map((item) => (
                <Link key={item.name} href={item.href} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap border ${normalizeText(categoryParam) === normalizeText(item.name) ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]' : 'bg-white/[0.05] border-white/10'}`}>
                  <span className="text-xs font-bold text-white/90">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block shrink-0">
            <div className="sticky top-32">
              <FilterSidebar
                singleSelects={[{ key: "year", label: "Año", value: currentYear, options: [{ value: "", label: "Todos" }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))] }]}
                multiSelects={[{ key: "genre", label: "Géneros", value: currentGenres, options: genreOptions }]}
                onApply={handleApplyFilters}
                onReset={() => router.push(pathname)}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center mb-8">
              <div className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full mr-4 shadow-[0_0_15px_rgba(249,195,164,0.5)]" />
              <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">
                Contenido <span className="text-[var(--color-primary)]">{categoryParam}</span>
              </h2>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {categoryMedia.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  >
                    <MediaCard media={item} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {categoryMedia.length === 0 && (
              <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 mt-10">
                <p className="text-white/40 uppercase tracking-widest text-xs font-bold">Sin resultados para esta categoría</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal de Filtros Móvil */}
      <AnimatePresence>
        {isFilterOpen && (
          <FilterSidebar
            singleSelects={[{ key: "year", label: "Año", value: currentYear, options: [{ value: "", label: "Todos" }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))] }]}
            multiSelects={[{ key: "genre", label: "Géneros", value: currentGenres, options: genreOptions }]}
            onApply={handleApplyFilters}
            onReset={() => { router.push(pathname); setIsFilterOpen(false); }}
            isMobile
            onCloseMobile={() => setIsFilterOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}