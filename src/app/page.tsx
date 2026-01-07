"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import MediaCard from "@/components/MediaCard";
import MediaModal from "@/components/MediaModal"; 
import { useMediaModal } from "@/app/context/MediaModalContext";
import { Media } from "@/app/models/media";
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";
import ShootingStars from "@/components/ShootingStars";
import { categoryOptions, genreOptions } from "@/utils/filter-options";
import Link from "next/link";

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/free-mode';

type MediaItem = Media & { avg_rating?: number | null };

export default function HomePage() {
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { openModal } = useMediaModal();

  // Estados de Paginación y Filtros
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [filterTitle, setFilterTitle] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterGenre, setFilterGenre] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- LÓGICA DEL BADGE ---
  const hasActiveFilters = useMemo(() => {
    return filterTitle !== "" || filterYear !== "" || filterCategory.length > 0 || filterGenre.length > 0;
  }, [filterTitle, filterYear, filterCategory, filterGenre]);

  useEffect(() => {
    fetchTopRated();
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [page, filterTitle, filterYear, filterCategory, filterGenre]);

  async function fetchTopRated() {
    setLoadingTop(true);
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("media_id, rating");

      if (ratingsError || !ratingsData) return;

      const avgMap: Record<string, number> = {};
      const countMap: Record<string, number> = {};

      ratingsData.forEach((r) => {
        avgMap[r.media_id] = (avgMap[r.media_id] || 0) + r.rating;
        countMap[r.media_id] = (countMap[r.media_id] || 0) + 1;
      });

      const top10Ids = Object.entries(avgMap)
        .map(([mediaId, total]) => ({
          media_id: mediaId,
          avg_rating: total / countMap[mediaId],
        }))
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);

      const { data: mediaData } = await supabase
        .from("media")
        .select("id, title, synopsis, genre, category, poster_url, year, estreno, idioma, created_at, updated_at, slug")
        .in("id", top10Ids.map((i) => i.media_id));

      if (mediaData) {
        const finalTop = (mediaData as Media[]).map((m) => ({
          ...m,
          avg_rating: top10Ids.find((t) => t.media_id === m.id)?.avg_rating || 0,
        }));
        finalTop.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        setTopRated(finalTop as MediaItem[]);
      }
    } catch (err) {
      console.error("Top Rated Error:", err);
    } finally {
      setLoadingTop(false);
    }
  }

  async function fetchRecent() {
    setLoadingRecent(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase
        .from("media")
        .select("id, title, synopsis, poster_url, genre, year, category, estreno, created_at, updated_at, slug, idioma", { count: "exact" })
        .order("estreno", { ascending: false }) 
        .order("year", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filterTitle) query = query.ilike("title", `%${filterTitle}%`);
      if (filterYear) query = query.eq("year", filterYear);
      if (filterCategory.length) query = query.in("category", filterCategory);
      if (filterGenre.length) query = query.in("genre", filterGenre);

      const { data, error, count } = await query;
      if (error) throw error;

      setRecent(data as MediaItem[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading recent:", error);
    } finally {
      setLoadingRecent(false);
      if (page > 1 || filterTitle || filterCategory.length > 0) {
        const element = document.getElementById("main-content-anchor");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }

  const handleApplyFilters = (filters: Record<string, string | string[]>) => {
    setFilterTitle(filters.title as string || "");
    setFilterYear(filters.year ? Number(filters.year) : "");
    setFilterCategory(filters.category as string[] || []);
    setFilterGenre(filters.genre as string[] || []);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterTitle("");
    setFilterYear("");
    setFilterCategory([]);
    setFilterGenre([]);
    setPage(1);
    setIsFilterOpen(false);
  };

  const startYear = 1960;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    return { value: year.toString(), label: year.toString() };
  }).reverse();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)] overflow-x-hidden">
      <MediaModal />

      <section className="relative w-full pt-28 pb-12 overflow-hidden">
        <ShootingStars />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-indigo-600 blur-[100px] opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full border border-[var(--color-primary)]/20">
              Explora • Califica • Disfruta
            </span>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
              Bienvenido a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[#f9c3a4] to-white">
                Tu Catálogo Favorito
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-[var(--color-accent)] font-medium leading-relaxed mb-8 px-4 text-white/70">
              Descubre las producciones mejor valoradas por la comunidad y mantente al día con los estrenos más recientes.
            </p>
          </motion.div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 1 }} className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent mx-auto" />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-14 mt-8 relative z-10">
          <div className="flex items-center justify-between mb-6 px-2 sm:px-0">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
              <span className="bg-[var(--color-primary)] text-black px-2 py-0.5 rounded-md transform -rotate-2">TOP 10</span>
              LO MÁS VISTO
            </h2>
          </div>

          <div className="relative w-full overflow-visible">
            {loadingTop ? (
              <div className="flex gap-4 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="min-w-[180px] h-[280px] bg-white/5 rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : (
              <Swiper
                modules={[FreeMode, Autoplay]}
                grabCursor
                slidesPerView={1.3}
                spaceBetween={16}
                loop={topRated.length > 5}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                speed={800}
                breakpoints={{
                  480: { slidesPerView: 2.2, spaceBetween: 20 },
                  768: { slidesPerView: 3.5, spaceBetween: 25 },
                  1024: { slidesPerView: 4.5, spaceBetween: 30 },
                }}
                className="!overflow-visible py-5"
              >
                {topRated.map((media, index) => (
                  <SwiperSlide key={`top-${media.id}`}>
                    <motion.div 
                      whileTap={{ scale: 0.95 }} 
                      className="relative group cursor-pointer"
                      onClick={() => openModal(media)}
                    >
                      <div className="relative aspect-[2/3] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={media.poster_url || "/placeholder.jpg"}
                          alt={media.title}
                          className="w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-black/10 to-transparent" />
                        <div className="absolute top-3 md:top-4 left-0 bg-gradient-to-r from-[var(--color-primary)] to-[#e8b293] text-black pl-3 pr-4 py-1 rounded-r-full flex items-center gap-1.5 z-20">
                          <span className="text-[10px] md:text-[11px] font-black tracking-wider uppercase">TOP {index + 1}</span>
                        </div>
                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 p-2 md:p-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl md:rounded-2xl">
                          <h3 className="text-white text-[10px] md:text-xs font-bold truncate mb-0.5">{media.title}</h3>
                          <div className="flex items-center justify-between text-[8px] md:text-[9px]">
                            <span className="text-[var(--color-primary)] font-black uppercase">{media.category}</span>
                            <span className="text-white/60">{media.year}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        <div className="my-10 h-px bg-white/10" id="main-content-anchor"></div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block shrink-0">
            <div className="sticky top-32">
              <FilterSidebar
                singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: yearOptions }]}
                multiSelects={[
                  { key: "category", label: "Categorías", value: filterCategory, options: categoryOptions },
                  { key: "genre", label: "Géneros", value: filterGenre, options: genreOptions }
                ]}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          <div className="lg:hidden flex flex-col mb-6">
            <div className="flex items-center gap-2 w-full">
              {/* BOTÓN FILTRO MÓVIL CON BADGE */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-black shadow-lg active:scale-95 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                  </svg>
                </button>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 z-30 flex h-3 w-3">
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
                  { name: "Info", href: "/descripcion" },
                ].map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl whitespace-nowrap">
                    <span className="text-xs font-bold text-white/90">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full mr-4 shadow-[0_0_15px_rgba(249,195,164,0.5)]" />
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight italic">
                  <span className="text-[var(--color-primary)] uppercase">Contenido</span> RECIENTE
                </h2>
              </div>
            </div>

            {loadingRecent ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-[1.5rem] bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {recent.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                    <p className="text-[var(--color-accent)]">No hay resultados para esta búsqueda</p>
                  </div>
                ) : (
                  <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    <AnimatePresence mode="popLayout">
                      {recent.map((media, index) => (
                        <motion.div
                          key={`recent-${media.id}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                        >
                          <MediaCard media={media} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {recent.length > 0 && (
                  <div className="flex flex-col items-center gap-4 mt-12 md:mt-16 pb-12">
                    <p className="text-[var(--color-accent)] text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-60">
                      Mostrando {recent.length} de {totalCount} resultados
                    </p>
                    <div className="flex justify-center items-center gap-2 md:gap-6">
                      <button
                        disabled={page === 1 || loadingRecent}
                        onClick={() => setPage(page - 1)}
                        className="px-4 md:px-6 py-2.5 rounded-xl font-bold bg-white/5 border border-white/10 text-white disabled:opacity-20 active:scale-95 transition-transform"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl">
                        <span className="text-[var(--color-primary)] text-sm md:text-lg font-black">{page}</span>
                        <span className="text-white/20 mx-2">/</span>
                        <span className="text-white/60 text-sm md:text-lg font-bold">{totalPages || 1}</span>
                      </div>
                      <button
                        disabled={page >= totalPages || loadingRecent}
                        onClick={() => setPage(page + 1)}
                        className="px-4 md:px-6 py-2.5 rounded-xl font-bold bg-[var(--color-primary)] text-black disabled:opacity-20 active:scale-95 transition-transform"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <FilterSidebar
            singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: yearOptions }]}
            multiSelects={[
              { key: "category", label: "Categorías", value: filterCategory, options: categoryOptions },
              { key: "genre", label: "Géneros", value: filterGenre, options: genreOptions }
            ]}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isMobile
            onCloseMobile={() => setIsFilterOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}