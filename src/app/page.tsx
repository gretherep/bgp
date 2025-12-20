"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import MediaCard from "@/components/MediaCard";
import { Media } from "@/app/models/media";
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";
import 'swiper/css';
import 'swiper/css/autoplay';

// Importar estilos de Swiper para asegurar funcionamiento
import 'swiper/css';
import 'swiper/css/free-mode';
import Link from "next/link";
import ShootingStars from "@/components/ShootingStars";

type MediaItem = Media & { avg_rating?: number | null };

export default function HomePage() {
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filterTitle, setFilterTitle] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterGenre, setFilterGenre] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchTopRated();
    fetchRecent();
  }, [page, filterTitle, filterYear, filterCategory, filterGenre]);

  /** ⭐ TOP 10 MEJOR VALORADAS */
  async function fetchTopRated() {
    setLoadingTop(true);
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("ratings")
      .select("media_id, rating");

    if (ratingsError) {
      console.error("Error ratings:", ratingsError);
      setLoadingTop(false);
      return;
    }

    const avgMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    for (const r of ratingsData) {
      avgMap[r.media_id] = (avgMap[r.media_id] || 0) + r.rating;
      countMap[r.media_id] = (countMap[r.media_id] || 0) + 1;
    }

    const avgArray = Object.entries(avgMap).map(([mediaId, total]) => ({
      media_id: mediaId,
      avg_rating: total / countMap[mediaId],
    }));

    const top10Ids = avgArray
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 10);

    if (!top10Ids.length) {
      setTopRated([]);
      setLoadingTop(false);
      return;
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .select(`
        id,
        title,
        synopsis,
        genre,
        category,
        poster_url,
        year,
        created_at,
        updated_at,
        slug
      `)
      .in("id", top10Ids.map((i) => i.media_id));

    if (mediaError) {
      console.error("Error media:", mediaError);
      setLoadingTop(false);
      return;
    }

    const finalTop = mediaData.map((m) => ({
      ...m,
      avg_rating: top10Ids.find((t) => t.media_id === m.id)?.avg_rating || 0,
    }));

    finalTop.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    setTopRated(finalTop);
    setLoadingTop(false);
  }

  /** ⭐ RECIENTES PAGINADOS CON FILTROS MULTI */
  async function fetchRecent() {
    setLoadingRecent(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("media")
      .select("id, title, synopsis, poster_url, genre, year, category, created_at, updated_at, slug")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filterTitle) query = query.ilike("title", `%${filterTitle}%`);
    if (filterYear) query = query.eq("year", filterYear);
    if (filterCategory.length) query = query.in("category", filterCategory);
    if (filterGenre.length) query = query.in("genre", filterGenre);

    const { data, error } = await query;

    if (error) {
      console.error("Error loading recent:", error);
      setLoadingRecent(false);
      return;
    }

    setRecent(data);
    setLoadingRecent(false);
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1999 },
    (_, i) => {
      const year = 2000 + i;
      return { value: year.toString(), label: year.toString() };
    }
  ).reverse();

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

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)] overflow-x-hidden">
      
      <section className="relative w-full pt-28 pb-12 overflow-hidden">
        <ShootingStars />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-indigo-600 blur-[100px] opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full border border-[var(--color-primary)]/20"
            >
              Explora • Califica • Disfruta
            </motion.span>
            
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
              Bienvenido a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[#f9c3a4] to-white">
                Tu Catálogo Favorito
              </span>
            </h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-2xl mx-auto text-base md:text-lg text-[var(--color-accent)] font-medium leading-relaxed mb-8 px-4"
            >
              Descubre las producciones mejor valoradas por la comunidad y mantente al día con los estrenos más recientes.
            </motion.p>
          </motion.div>
          <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent mx-auto"
            />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 🌟 TOP 10 - CORREGIDO PARA MÓVIL */}
        <section className="mb-14 mt-8 relative z-10">
          <div className="flex items-center justify-between mb-6 px-2 sm:px-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                <span className="bg-[var(--color-primary)] text-black px-2 py-0.5 rounded-md transform -rotate-2">TOP 10</span>
                LO MÁS VISTO
              </h2>
              <p className="text-[var(--color-accent)] text-[10px] md:text-xs font-medium ml-1">Actualizado hace instantes</p>
            </div>
          </div>

          {/* Contenedor del Swiper con overflow controlado */}
          <div className="relative w-full overflow-visible">
            {loadingTop ? (
              <div className="flex gap-4 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="min-w-[180px] h-[280px] bg-white/5 rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : (
              <Swiper
                modules={[FreeMode,Autoplay]}
                grabCursor={true}
                slidesPerView={1.3} // Se ve una tarjeta y parte de la otra para invitar al scroll
                spaceBetween={16}
                freeMode={false}
                loop={true}
                autoplay={{
                delay: 2500,
                disableOnInteraction: false,
                }}
                speed={800}
                breakpoints={{
                  480: { slidesPerView: 2.2, spaceBetween: 20 },
                  768: { slidesPerView: 3.2, spaceBetween: 25 },
                  1024: { slidesPerView: 4.2, spaceBetween: 30 },
                }}
                className="!overflow-visible py-5" 
              >
                {topRated.map((media, index) => (
                  <SwiperSlide key={media.id}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="relative group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={media.poster_url || "/placeholder.jpg"}
                          alt={media.title}
                          className="w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-black/10 to-transparent" />

                        <div className="absolute top-3 md:top-4 left-0 bg-gradient-to-r from-[var(--color-primary)] to-[#e8b293] text-black pl-3 pr-4 py-1 rounded-r-full flex items-center gap-1.5 shadow-lg z-20">
                          <span className="text-xs">🔥</span>
                          <span className="text-[10px] md:text-[11px] font-black tracking-wider uppercase">TOP {index + 1}</span>
                        </div>

                        <div className="absolute top-3 md:top-4 right-3 md:right-4 backdrop-blur-md bg-black/40 border border-white/20 px-2 py-0.5 md:py-1 rounded-xl flex items-center gap-1">
                          <span className="text-[var(--color-primary)] text-xs">★</span>
                          <span className="text-white text-[10px] font-bold">{(media.avg_rating || 0).toFixed(1)}</span>
                        </div>

                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 p-2 md:p-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl md:rounded-2xl">
                          <h3 className="text-white text-[10px] md:text-xs font-bold truncate mb-0.5 md:mb-1">
                            {media.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--color-primary)] text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                              {media.category}
                            </span>
                            <span className="text-white/60 text-[8px] md:text-[9px]">{media.year}</span>
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

        <div className="my-10 h-px bg-white/10"></div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block">
            <FilterSidebar
              textInputs={[{ key: "title", label: "Título", value: filterTitle }]}
              singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: yearOptions }]}
              multiSelects={[
                { 
                  key: "category", label: "Categorías", value: filterCategory, 
                  options: [
                    {value: "Películas", label: "Películas"}, {value: "Series", label: "Series"},
                    {value: "Novelas", label: "Novelas"}, {value: "Reality Shows", label: "Reality Shows"},
                    {value: "MiniSeries", label: "MiniSeries"}, {value: "Series Animadas", label: "Series Animadas"},
                    {value: "Películas Animadas", label: "Películas Animadas"}, {value: "Anime", label: "Anime"},
                    {value: "Películas Anime", label: "Películas Anime"}
                  ]
                },
                { 
                  key: "genre", label: "Géneros", value: filterGenre, 
                  options: [
                    {value: "Acción", label: "Acción"}, {value: "Drama", label: "Drama"},
                    {value: "Comedia", label: "Comedia"}, {value: "Terror", label: "Terror"},
                    {value: "Romance", label: "Romance"}, {value: "Aventura", label: "Aventura"}
                  ]
                }
              ]}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </div>

          <div className="lg:hidden flex flex-col mb-6">
            <div className="flex items-center gap-2 w-full">
              
              {/* 1. Botón de Filtros Integrado */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-black shadow-lg active:scale-90 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                </svg>
              </button>

              {/* 2. Tabs de Navegación (Tus NavItems) */}
              <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar select-none">
                {[
                  { name: "Películas", href: "/category/peliculas", icon: "🎬" },
                  { name: "Series", href: "/category/series", icon: "📺" },
                  { name: "Anime", href: "/category/anime", icon: "🍱" },
                  { name: "Novelas", href: "/category/novelas", icon: "🎭" },
                  { name: "Reality", href: "/category/reality", icon: "✨" },
                  { name: "Info", href: "/descripcion", icon: "📝" },
                ].map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl whitespace-nowrap active:bg-white/10 transition-colors"
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs font-bold text-white/90">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

 {/* 📺 Contenido Principal */}
<main className="flex-1 min-w-0">
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center">
      <div className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full mr-4 shadow-[0_0_15px_rgba(249,195,164,0.5)]" />
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
        <span className="text-[var(--color-primary)]">CONTENIDO</span> RECIENTE
      </h2>
    </div>
    
    {/* Badge de cantidad (Opcional, se ve pro) */}
    {!loadingRecent && recent.length > 0 && (
      <span className="hidden sm:block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[var(--color-accent)] tracking-widest uppercase">
        {recent.length} Resultados
      </span>
    )}
  </div>

  {loadingRecent ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(10)].map((_, i) => (
        <div 
          key={i} 
          className="aspect-[2/3] rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse border border-white/5" 
        />
      ))}
    </div>
  ) : (
    <>
      {recent.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10"
        >
          <div className="text-6xl mb-4 grayscale opacity-50">🎬</div>
          <p className="text-xl font-medium text-[var(--color-accent)]">
            No encontramos lo que buscas
          </p>
          <p className="text-sm text-white/40 mt-2">Prueba ajustando los filtros de búsqueda</p>
        </motion.div>
      ) : (
        <motion.div 
          layout // Para animar suavemente cuando cambian los filtros
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {recent.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -8 }} // Sube un poco al pasar el mouse
                className="relative"
              >
                {/* Aquí usamos tu MediaCard, pero le puedes pasar una clase 
                   o envolverla para que herede el estilo premium 
                */}
                <div className="group relative transition-all duration-300">
                  <MediaCard media={{ ...media }} />
                  
                  {/* Overlay sutil de brillo al hacer hover (opcional) */}
                  <div className="absolute inset-0 rounded-xl md:rounded-[2rem] pointer-events-none group-hover:bg-gradient-to-t group-hover:from-[var(--color-primary)]/10 group-hover:to-transparent transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Paginación Estilizada */}
{/* Paginación Estilizada y Responsive */}
{recent.length > 0 && (
  <div className="flex justify-center items-center gap-2 md:gap-6 mt-12 md:mt-16 pb-12">
    
    {/* Botón Anterior */}
    <button
      disabled={page === 1}
      onClick={() => {
        setPage(page - 1);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }}
      className="group flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all disabled:opacity-10 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-white/10 text-white"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="hidden sm:inline">Anterior</span>
    </button>
    
    {/* Indicador de Página Compacto */}
    <div className="flex items-center px-4 py-2 md:py-3 bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl">
      <span className="text-white/40 text-[10px] md:text-sm font-medium mr-2 uppercase tracking-tighter">Pág</span>
      <span className="text-[var(--color-primary)] text-sm md:text-lg font-black min-w-[20px] text-center">
        {page}
      </span>
    </div>
    
    {/* Botón Siguiente */}
    <button
      disabled={recent.length < pageSize}
      onClick={() => {
        setPage(page + 1);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }}
      className="group flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all disabled:opacity-10 disabled:cursor-not-allowed bg-[var(--color-primary)] hover:shadow-[0_0_20px_rgba(249,195,164,0.4)] text-black"
    >
      <span className="hidden sm:inline">Siguiente</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
)}
    </>
  )}
</main>
        </div>

        {isFilterOpen && (
          <FilterSidebar
            textInputs={[{ key: "title", label: "Título", value: filterTitle }]}
            singleSelects={[{ key: "year", label: "Año", value: filterYear.toString(), options: yearOptions }]}
            multiSelects={[
              { key: "category", label: "Categorías", value: filterCategory, options: [{value: "Películas", label: "Películas"}, {value: "Series", label: "Series"}] },
              { key: "genre", label: "Géneros", value: filterGenre, options: [{value: "Acción", label: "Acción"}] }
            ]}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isMobile={true}
            onCloseMobile={() => setIsFilterOpen(false)}
          />
        )}
      </div>
    </div>
  );
}