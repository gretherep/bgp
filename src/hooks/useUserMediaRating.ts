import { useEffect, useState } from "react";

export function useUserMediaRating(
  mediaId: string | null,
  userId: string | null
) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mediaId || !userId) {
      setUserRating(null);
      return;
    }

    const loadUserRating = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ratings/user?mediaId=${mediaId}&userId=${userId}`
        );
        const data = await res.json();
        setUserRating(data.rating ?? null);
      } catch {
        setUserRating(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserRating();
  }, [mediaId, userId]);

  return {
    userRating,
    setUserRating, // 👈 importante para feedback inmediato
    loading,
  };
}
