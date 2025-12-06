"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Media } from "@/app/models/media";
import MediaModal from "@/components/MediaModal";

type MediaItem = Media & { avg_rating?: number | null };

interface MediaModalContextType {
  selectedMedia: MediaItem | null;
  openModal: (media: MediaItem) => void;
  closeModal: () => void;
}

const MediaModalContext = createContext<MediaModalContextType | undefined>(undefined);

export const useMediaModal = () => {
  const context = useContext(MediaModalContext);
  if (!context) {
    throw new Error("useMediaModal must be used within a MediaModalProvider");
  }
  return context;
};

export const MediaModalProvider = ({ children }: { children: ReactNode }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const openModal = (media: MediaItem) => setSelectedMedia(media);
  const closeModal = () => setSelectedMedia(null);

  return (
    <MediaModalContext.Provider value={{ selectedMedia, openModal, closeModal }}>
      {children}
      {/* ✅ Usa tu componente bonito, no el modal inline */}
      <MediaModal />
    </MediaModalContext.Provider>
  );
};