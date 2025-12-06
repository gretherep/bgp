'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import MediaCard from "@/components/MediaCard";
import { Media } from "@/app/models/media";
import MultiSelect from "@/components/MultiSelect";

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
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 🟡 TOP 10 MEJOR VALORADAS */}
        <section className="mb-10">
          <div className="flex items-center mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-yellow-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.185a.75.75 0 01.902 0l3.968 2.531a.75.75 0 00.902 0l3.968-2.531a.75.75 0 01.902 0l1.2 1.916a.75.75 0 01-.225.967l-3.218 2.872a.75.75 0 00-.225.755l.391 3.51a.75.75 0 01-1.096.793l-3.41-2.193a.75.75 0 00-.776 0l-3.41 2.193a.75.75 0 01-1.096-.793l.391-3.51a.75.75 0 00-.225-.755L3.921 5.068a.75.75 0 01-.225-.967l1.2-1.916a.75.75 0 01.902 0z"
              />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Top 10 Mejor Valoradas</h2>
          </div>

          {loadingTop ? (
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="min-w-[140px] sm:min-w-[160px] h-[220px] bg-gray-800 animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, FreeMode]}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              freeMode={true}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 5, spaceBetween: 20 },
                1280: { slidesPerView: 6, spaceBetween: 24 },
              }}
              spaceBetween={12}
              className="pb-4"
            >
              {topRated.map((media) => (
                <SwiperSlide key={media.id} className="!flex !justify-center">
                  <div className="w-full max-w-[160px]">
                    <div className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                      <img
                        src={media.poster_url || "https://placehold.co/150x230/1f2937/FFF?text=No+Poster"}
                        alt={media.title}
                        className="w-full h-[230px] object-cover transition-opacity duration-300 group-hover:opacity-90"
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/150x230/1f2937/FFF?text=No+Poster"; }}
                      />
                    </div>
                    <div className="mt-2 flex flex-col items-center">
                      <div className="flex items-center space-x-0.5">
                        {"★".repeat(Math.round(media.avg_rating || 0))}
                        {"☆".repeat(5 - Math.round(media.avg_rating || 0))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ({(media.avg_rating || 0).toFixed(1)})
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        <hr className="border-gray-800 my-8" />

        {/* 🗂️ Contenido Reciente con Filtros */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 🔍 Sidebar de Filtros */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg w-full">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z"
                  />
                </svg>
                Filtros
              </h3>

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Título</label>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Año */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Año</label>
                  <input
                    type="number"
                    placeholder="Ej: 2023"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Categorías */}
                <div className="w-full max-w-full">
                  <MultiSelect
                    label="Categorías"
                    options={[
                      "Películas", "Series", "Novelas", "Reality Shows",
                      "MiniSeries", "Series Animadas", "Películas Animadas", "Anime", "Películas Anime"
                    ]}
                    selected={filterCategory}
                    onChange={(v) => { setFilterCategory(v); setPage(1); }}
                    
                  />
                </div>

                {/* Géneros */}
                <div className="w-full max-w-full">
                  <MultiSelect
                    label="Géneros"
                    options={["Acción", "Drama", "Comedia", "Terror", "Romance", "Aventura"]}
                    selected={filterGenre}
                    onChange={(v) => { setFilterGenre(v); setPage(1); }}
                    
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* 📺 Contenido Principal */}
          <main className="flex-1">
            <div className="flex items-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-amber-400 mr-2"
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
              <h2 className="text-xl sm:text-2xl font-bold">Contenido Reciente</h2>
            </div>

            {loadingRecent ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-gray-800 aspect-[2/3] rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {recent.map((media) => (
                    <MediaCard key={media.id} media={{ ...media }} />
                  ))}
                </div>

                {/* Paginación */}
                <div className="flex justify-center items-center space-x-3 mt-10 pb-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-5 py-2 bg-gray-800 hover:bg-amber-600 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-400">Página {page}</span>
                  <button
                    disabled={recent.length < pageSize}
                    onClick={() => setPage(page + 1)}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}