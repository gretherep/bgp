"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import dynamic from "next/dynamic";
import type { HomeMedia } from "@/lib/catalog";

// La ficha se descarga recién al abrir el primer título.
const MediaModal = dynamic(() => import("@/components/MediaModal"), { ssr: false });

type MediaItem = HomeMedia;

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
      {/* Montada solo mientras hay un título abierto */}
      {selectedMedia && <MediaModal />}
    </MediaModalContext.Provider>
  );
};
