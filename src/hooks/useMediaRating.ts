import { useEffect, useState } from "react";

export function useMediaRating(mediaId: string | null) {
  const [avgRating, setAvgRating] = useState<number>(0);

  useEffect(() => {
    if (!mediaId) {
      setAvgRating(0);
      return;
    }

    const loadAvg = async () => {
      const res = await fetch(`/api/ratings/avg?mediaId=${mediaId}`);
      const data = await res.json();
      setAvgRating(data.avg ?? 0);
    };

    loadAvg();
  }, [mediaId]);

  return avgRating;
}
