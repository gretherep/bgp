"use client";

import { useMediaModal } from "@/app/context/MediaModalContext";

export default function MediaModal() {
  const { selectedMedia, closeModal } = useMediaModal();
  const isOpen = !!selectedMedia;

  if (!isOpen || !selectedMedia) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderRating = () => {
    if (selectedMedia.avg_rating == null) return null;
    const rating = Number(selectedMedia.avg_rating.toFixed(1));
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1.5 mt-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => {
            const starIndex = i + 1;
            let variant = "empty";
            if (starIndex <= fullStars) variant = "full";
            else if (starIndex === fullStars + 1 && hasHalf) variant = "half";

            return (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  variant === "full" || variant === "half"
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-accent)]"
                }`}
                fill={variant === "full" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1"
                viewBox="0 0 24 24"
              >
                {variant === "half" ? (
                  <path d="M12 2l3.09 9.26L23 13l-7.81 5.74L12 24l-3.19-8.76L1 13l7.91-1.74L12 2z" clipPath="url(#half-star)" />
                ) : (
                  <path d="M12 2l3.09 9.26L23 13l-7.81 5.74L12 24l-3.19-8.76L1 13l7.91-1.74L12 2z" />
                )}
                <defs>
                  <clipPath id="half-star">
                    <rect width="12" height="24" />
                  </clipPath>
                </defs>
              </svg>
            );
          })}
        </div>
        <span className="text-[var(--color-primary)] font-medium text-sm">{rating}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6"
      onClick={closeModal}
    >
      <div
        className="text-[var(--color-secondary)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: 'rgba(22, 18, 20, 0.95)',
          border: '1px solid rgba(149, 153, 158, 0.3)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-[var(--color-accent)] hover:text-[var(--color-secondary)] transition-all duration-200 backdrop-blur-sm z-10"
          aria-label="Cerrar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6 max-h-[80vh] overflow-y-auto">
          <div className="md:w-1/3 flex-shrink-0">
            <div className="relative group">
              <img
                src={selectedMedia.poster_url || "https://placehold.co/300x450/1f2937/9CA3AF?text=Sin+Poster"}
                alt={selectedMedia.title}
                className="w-full h-auto object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/300x450/1f2937/9CA3AF?text=Sin+Poster";
                }}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {selectedMedia.title}
            </h2>

            {/* 👇 Tags con colores ORIGINALES (indigo, emerald, amber) */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-indigo-900/40 text-indigo-300 rounded-full text-xs font-medium border border-indigo-800/50">
                {selectedMedia.category}
              </span>
              <span className="px-3 py-1.5 bg-emerald-900/40 text-emerald-300 rounded-full text-xs font-medium border border-emerald-800/50">
                {selectedMedia.genre}
              </span>
              <span className="px-3 py-1.5 bg-amber-900/30 text-amber-300 rounded-full text-xs font-medium border border-amber-800/50">
                {selectedMedia.year}
              </span>
            </div>

            {renderRating()}

            <div className="mt-3">
              <h3 className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-2">
                Sinopsis
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-secondary)]">
                {selectedMedia.synopsis || "Sinopsis no disponible."}
              </p>
            </div>

            <div className="mt-auto pt-3 border-t" style={{ borderColor: 'rgba(149, 153, 158, 0.2)' }}>
              <p className="text-xs text-[var(--color-accent)]">
                Agregado el <time dateTime={selectedMedia.created_at}>
                  {selectedMedia.created_at ? formatDate(selectedMedia.created_at) : "—"}
                </time>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}