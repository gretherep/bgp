"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import MediaCard from "@/components/MediaCard";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query.trim()) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  async function fetchResults() {
    setLoading(true);

    const { data, error } = await supabase
      .from("media")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setResults([]);
    } else {
      setResults(data);
    }
    setLoading(false);
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-secondary)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Encabezado de búsqueda */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Resultados para:{" "}
          <span style={{ color: 'var(--color-primary)' }}>"{query}"</span>
        </h1>
        <p 
          className="mb-8"
          style={{ color: 'var(--color-accent)' }}
        >
          {loading ? "Buscando..." : `${results.length} títulos encontrados`}
        </p>

        <hr 
          className="my-6"
          style={{ borderColor: 'rgba(149, 153, 158, 0.2)' }}
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-[2/3] rounded-lg animate-pulse"
                style={{ backgroundColor: 'rgba(149, 153, 158, 0.2)' }}
              ></div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl mb-2" style={{ color: 'var(--color-accent)' }}>
              No se encontraron títulos con{" "}
              <span style={{ color: 'var(--color-primary)', fontWeight: '500' }}>"{query}"</span>.
            </p>
            <p style={{ color: 'rgba(149, 153, 158, 0.7)' }}>
              Intenta con otro término o revisa la ortografía.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((media) => (
              <MediaCard
                key={media.id}
                media={{ ...media, avg_rating: media.avg_rating || 0 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}