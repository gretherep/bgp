// app/layout.tsx (Modificado)
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import '@/styles/globals.css';
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/autoplay";
import { MediaModalProvider } from "./context/MediaModalContext";
import MediaModal from "@/components/MediaModal";
import { ToastProvider } from "./context/ToastContext";



export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="en">
      <body className={`antialiased ${isAdminRoute ? "" : "pt-16"} bg-gray-950`}>
        
        {/* 2. ENVOLVER TODA LA LÓGICA DE LA APLICACIÓN CON ToastProvider */}
        <ToastProvider> 
          <MediaModalProvider>
            
            {/* Componentes de la app */}
            {!isAdminRoute && <Navbar onOpenLogin={() => setIsLoginOpen(true)} />}

            <LoginModal
              isOpen={isLoginOpen}
              onClose={() => setIsLoginOpen(false)}
            />



            {/* Contenido principal */}
            <main>{children}</main>
            
          </MediaModalProvider>
        </ToastProvider> 
        
      </body>
    </html>
  );
}