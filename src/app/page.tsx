"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllMedia } from "@/app/actions/media.actions"; 
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

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/free-mode';

type MediaItem = Media & { avg_rating?: number | null };

export default function HomePage() {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useMediaModal();

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [filterTitle, setFilterTitle] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterGenre, setFilterGenre] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getAllMedia();
      setAllMedia((data as MediaItem[]) || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredMedia = useMemo(() => {
    const filtered = allMedia.filter((m) => {
      const matchTitle = m.title.toLowerCase().includes(filterTitle.toLowerCase());
      const matchYear = filterYear ? m.year === filterYear : true;
      const matchCat = filterCategory.length ? filterCategory.includes(m.category) : true;
      
      let matchGenre = true;
      if (filterGenre.length > 0) {
        const mediaGenres = m.genre ? m.genre.toLowerCase().split(/[- ,]+/) : [];
        matchGenre = filterGenre.some(g => mediaGenres.includes(g.toLowerCase()));
      }
      return matchTitle && matchYear && matchCat && matchGenre;
    });

    return filtered.sort((a, b) => {
      if (a.estreno === b.estreno) {
        return (b.year || 0) - (a.year || 0);
      }
      return a.estreno ? -1 : 1;
    });
  }, [allMedia, filterTitle, filterYear, filterCategory, filterGenre]);

  const topRated = useMemo(() => {
    return [...allMedia]
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 10);
  }, [allMedia]);

  const currentItems = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredMedia.slice(from, from + pageSize);
  }, [filteredMedia, page]);

  const totalPages = Math.ceil(filteredMedia.length / pageSize);
  const hasActiveFilters = filterTitle !== "" || filterYear !== "" || filterCategory.length > 0 || filterGenre.length > 0;

  const handleApplyFilters = (filters: any) => {
    setFilterTitle(filters.title || "");
    setFilterYear(filters.year ? Number(filters.year) : "");
    setFilterCategory(filters.category || []);
    setFilterGenre(filters.genre || []);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterTitle(""); setFilterYear(""); setFilterCategory([]); setFilterGenre([]); setPage(1);
  };

  const yearOptions = Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => {
    const year = 1960 + i;
    return { value: year.toString(), label: year.toString() };
  }).reverse();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)] overflow-x-hidden">
      <MediaModal />

      {/* Hero Section */}
      <section className="relative w-full pt-28 pb-12 overflow-hidden">
        <ShootingStars />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter italic">
              BIENVENIDO A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[#f9c3a4] to-white uppercase">
                Tu Catálogo Favorito
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP 10 (Diseño que te gusta) */}
        <section className="mb-14 mt-8 relative z-10">
          <h2 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-2">
            <span className="bg-[var(--color-primary)] text-black px-2 py-0.5 rounded-md transform -rotate-2 italic">TOP 10</span>
            LO MÁS VISTO
          </h2>
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
                        <div className="absolute inset-0 bg-gradient-to-t  to-transparent" />
                        <div className="absolute top-3 md:top-4 left-0 bg-gradient-to-r from-[var(--color-primary)] to-[#e8b293] text-black pl-3 pr-4 py-1 rounded-r-full flex items-center gap-1.5 z-20">
                          <span className="text-[10px] md:text-[11px] font-black tracking-wider uppercase">TOP {index + 1}</span>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
          </Swiper>
        </section>

        <div className="my-10 h-px bg-white/10" id="main-content-anchor"></div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block shrink-0">
            <div className="sticky top-32">
              <FilterSidebar
                singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: [{value: "", label: "Todos"}, ...yearOptions] }]}
                multiSelects={[
                  { key: "category", label: "Categorías", value: filterCategory, options: categoryOptions },
                  { key: "genre", label: "Géneros", value: filterGenre, options: genreOptions }
                ]}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* --- BLOQUE MÓVIL RECUPERADO: BOTÓN FILTRO + TABS --- */}
          <div className="lg:hidden flex flex-col mb-8">
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
                  <Link key={item.name} href={item.href} className="flex items-center px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl whitespace-nowrap">
                    <span className="text-xs font-bold text-white/90">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <main className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8 italic uppercase">
              <span className="text-[var(--color-primary)]">Contenido</span> RECIENTE
            </h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-[1.5rem] bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <>
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  <AnimatePresence mode="popLayout">
                    {currentItems.map((media) => (
                      <motion.div key={media.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <MediaCard media={media} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Paginación */}
                {filteredMedia.length > 0 && (
                  <div className="flex justify-center items-center gap-6 mt-12 pb-12">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold disabled:opacity-20 transition-all active:scale-95">Anterior</button>
                    <span className="text-[var(--color-primary)] font-black text-lg">{page} / {totalPages || 1}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-6 py-2.5 bg-[var(--color-primary)] text-black rounded-xl font-bold disabled:opacity-20 transition-all active:scale-95">Siguiente</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Sidebar Móvil */}
      <AnimatePresence>
        {isFilterOpen && (
          <FilterSidebar
            singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: [{value: "", label: "Todos"}, ...yearOptions] }]}
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