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
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Encabezado de búsqueda */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Resultados para:{" "}
          <span className="text-amber-400">"{query}"</span>
        </h1>
        <p className="text-gray-400 mb-8">
          {loading ? "Buscando..." : `${results.length} títulos encontrados`}
        </p>

        <hr className="border-gray-800 my-6" />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-800 aspect-[2/3] rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl text-gray-400">
              No se encontraron títulos con <span className="text-amber-400 font-medium">"{query}"</span>.
            </p>
            <p className="text-gray-500 mt-2">
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