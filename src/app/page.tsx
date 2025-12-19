'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import MediaCard from "@/components/MediaCard";
import { Media } from "@/app/models/media";
import MultiSelect from "@/components/MultiSelect";
import { motion } from "framer-motion";

type MediaItem = Media & { avg_rating?: number | null };

export default function HomePage() {
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 🔹 FILTROS RECENTES
  const [filterTitle, setFilterTitle] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterGenre, setFilterGenre] = useState<string[]>([]);

  useEffect(() => {
    fetchTopRated();
    fetchRecent();
  }, [page, filterTitle, filterYear, filterCategory, filterGenre]);

  /** ⭐ TOP 10 MEJOR VALORADAS */
async function fetchTopRated() {
  setLoadingTop(true);

  // 1️⃣ Obtener promedios reales desde ratings
  const { data: ratingsData, error: ratingsError } = await supabase
    .from("ratings")
    .select("media_id, rating");

  if (ratingsError) {
    console.error("Error ratings:", ratingsError);
    setLoadingTop(false);
    return;
  }

  // 2️⃣ Calcular promedios por media_id
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

  // 3️⃣ Ordenar por promedio DESC y tomar Top 10
  const top10Ids = avgArray
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 10);

  if (!top10Ids.length) {
    setTopRated([]);
    setLoadingTop(false);
    return;
  }

  // 4️⃣ Traer los datos reales de media
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

  // 5️⃣ Unir media + avg
  const finalTop = mediaData.map((m) => ({
    ...m,
    avg_rating: top10Ids.find((t) => t.media_id === m.id)?.avg_rating || 0,
  }));

  // 6️⃣ Reordenar correctamente (por si Supabase alteró el orden)
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

  const toggleCategory = (value: string) => {
    setFilterCategory((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleGenre = (value: string) => {
    setFilterGenre((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
       {/* 🌟 TOP 10 MEJOR VALORADAS - CARRUSEL ANIMADO */}
<section className="mb-12 mt-20">
  <div className="flex items-center mb-6">
    <div 
      className="p-2 rounded-lg mr-3"
      style={{
        background: 'linear-gradient(90deg, var(--color-primary), #e8b293)',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        style={{ color: 'var(--color-background)' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.185a.75.75 0 01.902 0l3.968 2.531a.75.75 0 00.902 0l3.968-2.531a.75.75 0 01.902 0l1.2 1.916a.75.75 0 01-.225.967l-3.218 2.872a.75.75 0 00-.225.755l.391 3.51a.75.75 0 01-1.096.793l-3.41-2.193a.75.75 0 00-.776 0l-3.41 2.193a.75.75 0 01-1.096-.793l.391-3.51a.75.75 0 00-.225-.755L3.921 5.068a.75.75 0 01-.225-.967l1.2-1.916a.75.75 0 01.902 0z" />
      </svg>
    </div>
    <h2 className="text-xl font-bold" style={{ color: 'var(--color-secondary)' }}>
      <span 
        className="bg-clip-text text-transparent"
        style={{ 
          background: 'linear-gradient(90deg, var(--color-primary), #e8b293)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        Mejor Valoradas
      </span>
    </h2>
  </div>

  {loadingTop ? (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-40 h-56 bg-[var(--color-accent)]/15 rounded-2xl animate-pulse"></div>
      ))}
    </div>
  ) : topRated.length === 0 ? (
    <div className="text-center py-8">
      <div className="text-4xl mb-3 opacity-60">🎬</div>
      <p className="text-[var(--color-accent)] text-sm">Sin valoraciones aún</p>
    </div>
  ) : (
    <Swiper
      modules={[Autoplay, FreeMode]}
      autoplay={{ 
        delay: 2500, 
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      }}
      freeMode={true}
      slidesPerView={1.2}
      breakpoints={{
        640: { slidesPerView: 2.5, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 24 },
        1280: { slidesPerView: 5, spaceBetween: 28 },
      }}
      spaceBetween={16}
      className="pb-4"
    >
      {topRated.map((media) => (
        <SwiperSlide key={media.id} className="!flex !justify-center">
          <motion.div
            className="w-full max-w-[180px] cursor-pointer"
            whileHover={{ y: -12, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => {
              // Aquí implementarías el modal
              console.log("Abrir modal para:", media.title);
            }}
          >
            {/* Tarjeta animada */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl group transition-all duration-500">
              {/* Poster */}
              <div className="pb-[150%] relative">
                {media.poster_url ? (
                  <motion.img
                    src={media.poster_url}
                    alt={media.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                    <span className="text-[var(--color-accent)] text-xs px-1 text-center">Sin póster</span>
                  </div>
                )}
                {/* Overlay oscuro en hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
              </div>

              {/* Contenido inferior */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                {/* Título */}
                <h3 className="text-white text-xs font-semibold line-clamp-2 mb-2">
                  {media.title}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 5 }, (_, i) => {
                      const ratingValue = i + 1;
                      const isFilled = ratingValue <= Math.round(media.avg_rating || 0);
                      return (
                        <svg
                          key={i}
                          className="w-3 h-3"
                          fill={isFilled ? "#FBBF24" : "none"}
                          stroke={isFilled ? "#FBBF24" : "rgba(255, 255, 255, 0.7)"}
                          strokeWidth="1"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      );
                    })}
                  </div>
                  <span className="text-[#FBBF24] text-xs font-bold">
                    {(media.avg_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </SwiperSlide>
      ))}
    </Swiper>
  )}
</section>

        <div 
          className="my-10"
          style={{ height: '1px', backgroundColor: 'rgba(149, 153, 158, 0.2)' }}
        ></div>

        {/* 🗂️ Contenido Reciente con Filtros */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 🔍 Sidebar de Filtros (solo en desktop) */}
          <aside className="lg:w-64 flex-shrink-0">
            <div 
              className="p-5 rounded-2xl shadow-lg"
              style={{ 
                backgroundColor: 'rgba(149, 153, 158, 0.08)',
                border: '1px solid rgba(149, 153, 158, 0.25)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: 'var(--color-primary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                </svg>
                <span style={{ color: 'var(--color-primary)' }}>Filtros</span>
              </h3>

              <div className="space-y-5">
                <div>
                  <label 
                    className="block text-xs font-semibold uppercase mb-2 tracking-wide"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Título
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 transition"
                    style={{
                      backgroundColor: 'rgba(149, 153, 158, 0.15)',
                      border: '1px solid rgba(149, 153, 158, 0.3)',
                      color: 'var(--color-secondary)',
                     
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs font-semibold uppercase mb-2 tracking-wide"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Año
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 2023"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg px-3 py-2.5 transition"
                    style={{
                      backgroundColor: 'rgba(149, 153, 158, 0.15)',
                      border: '1px solid rgba(149, 153, 158, 0.3)',
                      color: 'var(--color-secondary)',
                     
                    }}
                  />
                </div>

                <MultiSelect
                  label="Categorías"
                  options={["Películas", "Series", "Novelas", "Reality Shows", "MiniSeries", "Series Animadas", "Películas Animadas", "Anime", "Películas Anime"]}
                  selected={filterCategory}
                  onChange={(v) => { setFilterCategory(v); setPage(1); }}
                />
                <MultiSelect
                  label="Géneros"
                  options={["Acción", "Drama", "Comedia", "Terror", "Romance", "Aventura"]}
                  selected={filterGenre}
                  onChange={(v) => { setFilterGenre(v); setPage(1); }}
                />
              </div>
            </div>
          </aside>

          {/* 📺 Contenido Principal */}
          <main className="flex-1">
            <div className="flex items-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[var(--color-primary)] mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-4.55a.8.8 0 011.12 0l.33.33a.8.8 0 010 1.12L16.4 11.4l-4.7 4.7a.8.8 0 01-1.12 0l-.33-.33a.8.8 0 010-1.12L13.6 11.4l1.4-1.4zM3 15v5a2 2 0 002 2h14a2 2 0 002-2v-5M3 9V4a2 2 0 012-2h14a2 2 0 012 2v5" />
              </svg>
              <h2 className="text-2xl font-bold text-[var(--color-secondary)] tracking-tight">
                <span className="text-[var(--color-primary)]">Contenido</span> Reciente
              </h2>
            </div>

            {loadingRecent ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="aspect-[2/3] rounded-xl animate-pulse"
                    style={{ backgroundColor: 'rgba(149, 153, 158, 0.15)' }}
                  ></div>
                ))}
              </div>
            ) : (
              <>
                {recent.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4 opacity-60">🎬</div>
                    <p className="text-xl" style={{ color: 'var(--color-accent)' }}>
                      No hay contenido disponible con estos filtros.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {recent.map((media) => (
                      <MediaCard key={media.id} media={{ ...media }} />
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {recent.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 pb-8">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'rgba(149, 153, 158, 0.15)',
                        color: 'var(--color-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (page !== 1) e.currentTarget.style.backgroundColor = 'rgba(249, 195, 164, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        if (page !== 1) e.currentTarget.style.backgroundColor = 'rgba(149, 153, 158, 0.15)';
                      }}
                    >
                      Anterior
                    </button>
                    
                    <span 
                      className="font-medium text-lg"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Página {page}
                    </span>
                    
                    <button
                      disabled={recent.length < pageSize}
                      onClick={() => setPage(page + 1)}
                      className="px-6 py-2.5 rounded-xl font-semibold text-[var(--color-background)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      onMouseEnter={(e) => {
                        if (recent.length >= pageSize) e.currentTarget.style.backgroundColor = '#e8b293';
                      }}
                      onMouseLeave={(e) => {
                        if (recent.length >= pageSize) e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}