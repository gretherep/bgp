"use client";

import { getAllMedia } from "@/app/actions/media.actions";
import { Media } from "@/app/models/media";
import MediaCard from "@/components/MediaCard";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FilterSidebar from "@/components/FilterSidebar";
import Link from "next/link";
import { genreOptions } from "@/utils/filter-options";


// ======================================================
type MediaWithRating = Media & { avg_rating: number };

// ======================================================
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);

// ======================================================
// CARRUSEL PREMIUM (SIN CAMBIOS)
// ======================================================
const TopRecentCarousel = ({ media }: { media: MediaWithRating[] }) => (
  <section className="mb-12">
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

// ======================================================
// PAGE
// ======================================================
export default function CategoryPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = useMemo(
    () => pathname.split("/").pop() || "",
    [pathname]
  );

  const [allMedia, setAllMedia] = useState<MediaWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ======================================================
  // PARAMS
  // ======================================================
  const currentYear = searchParams.get("year") || "";

  const currentGenres = useMemo(
    () => searchParams.get("genre")?.split(",") ?? [],
    [searchParams]
  );

  // ======================================================
  // FETCH
  // ======================================================
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
    return () => {
      active = false;
    };
  }, [categoryParam]);

  // ======================================================
  // FILTERING
  // ======================================================
  const categoryMedia = useMemo(() => {
    let filtered = allMedia.filter(
      m => normalizeText(m.category) === normalizeText(categoryParam)
    );

    if (currentYear) {
      filtered = filtered.filter(m => m.year?.toString() === currentYear);
    }

    if (currentGenres.length > 0) {
      filtered = filtered.filter(m =>
        currentGenres.some(g =>
          normalizeText(m.genre).includes(normalizeText(g))
        )
      );
    }

    return filtered;
  }, [allMedia, categoryParam, currentYear, currentGenres]);

  const top5Recent = useMemo(() => {
    return [...categoryMedia]
      .sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
      )
      .slice(0, 8);
  }, [categoryMedia]);

  // ======================================================
  // FILTER HANDLER
  // ======================================================
  const handleApplyFilters = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filters.year) params.set("year", filters.year);
    else params.delete("year");

    if (filters.genre?.length > 0)
      params.set("genre", filters.genre.join(","));
    else params.delete("genre");

    router.push(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div
      className="min-h-screen bg-[#161616ff] text-[#DCDAD9]"
      style={
        {
          "--color-primary": "#F9C3A4",
          "--color-secondary": "#DCDAD9",
          "--color-accent": "#95999E",
        } as any
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* HEADER */}
        <motion.div
          key={categoryParam}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white capitalize tracking-tighter italic">
            {categoryParam.replace(/-/g, " ")}
          </h1>
          <div className="h-1 w-20 bg-[var(--color-primary)] mt-2 rounded-full shadow-[0_0_15px_rgba(249,195,164,0.4)]" />
        </motion.div>

        {top5Recent.length > 0 && <TopRecentCarousel media={top5Recent} />}

        <hr className="my-10 border-white/5" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* DESKTOP FILTER */}
          <div className="hidden lg:block">
            <FilterSidebar
              singleSelects={[
                {
                  key: "year",
                  label: "Año",
                  value: currentYear,
                  options: [
                    { value: "", label: "Todos" },
                    ...YEAR_OPTIONS.map(y => ({ value: y, label: y })),
                  ],
                },
              ]}
              multiSelects={[
                {
                  key: "genre",
                  label: "Géneros",
                  value: currentGenres,
                  options: genreOptions,
                },
              ]}
              onApply={handleApplyFilters}
              onReset={() => router.push(pathname)}
            />
          </div>

          {/* MOBILE UI (SIN CAMBIOS VISUALES) */}
          <div className="lg:hidden flex flex-col mb-6">
            <div className="flex items-center gap-2 w-full">
<button
  onClick={() => setIsFilterOpen(true)}
  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-black shadow-lg active:scale-90 transition-transform"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z"
    />
  </svg>
</button>


              <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar">
                {[
                  { name: "Películas", href: "/category/peliculas", icon: "🎬" },
                  { name: "Series", href: "/category/series", icon: "📺" },
                  { name: "Anime", href: "/category/anime", icon: "🍱" },
                  { name: "Novelas", href: "/category/novelas", icon: "🎭" },
                  { name: "Reality", href: "/category/reality", icon: "✨" },
                  { name: "Info", href: "/descripcion", icon: "📝" },
                ].map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl whitespace-nowrap"
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs font-bold">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* GRID */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {categoryMedia.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10"
                >
                  No se encontraron títulos.
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                  {categoryMedia.map(item => (
                    <MediaCard key={item.id} media={item} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* MOBILE FILTER SIDEBAR */}
      {isFilterOpen && (
        <FilterSidebar
          singleSelects={[
            {
              key: "year",
              label: "Año",
              value: currentYear,
              options: [
                { value: "", label: "Todos" },
                ...YEAR_OPTIONS.map(y => ({ value: y, label: y })),
              ],
            },
          ]}
          multiSelects={[
            {
              key: "genre",
              label: "Géneros",
              value: currentGenres,
              options: genreOptions,
            },
          ]}
          onApply={handleApplyFilters}
          onReset={() => {
            router.push(pathname);
            setIsFilterOpen(false);
          }}
          isMobile
          onCloseMobile={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
}

// ======================================================
function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#161616ff] px-4 pt-32 max-w-7xl mx-auto">
      <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse mb-12" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
