"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import MessagePopup from "@/components/MessagePopup";
import ConfirmPopup from "@/components/ConfirmPopup";
import { MediaModalProvider } from "./context/MediaModalContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AnimatePresence } from "framer-motion";
import '@/styles/globals.css';

// Componente interno para poder usar useToast()
function LayoutContent({ 
  children, 
  isAdminRoute, 
  isLoginOpen, 
  setIsLoginOpen,
  message,
  setMessage 
}: any) {
  const { showToast } = useToast();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleFinalLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setShowConfirmLogout(false);
      showToast("¡Has cerrado sesión con éxito!", false); 
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setShowConfirmLogout(false);
    }
  };

  return (
    <>
      {!isAdminRoute && (
        <Navbar 
          onOpenLogin={() => setIsLoginOpen(true)} 
          onShowMessage={(msg) => setMessage(msg)}
          onConfirmLogout={() => setShowConfirmLogout(true)}
        />
      )}

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      {/* ✅ CORRECCIÓN AQUÍ: El padding pt-16 solo se aplica si NO es admin */}
      <main className={`min-h-screen ${!isAdminRoute ? "pt-16" : "pt-0"}`}>
        {children}
      </main>

      <AnimatePresence>
        {showConfirmLogout && (
          <ConfirmPopup
            message="¿Seguro que quieres cerrar sesión?"
            onConfirm={handleFinalLogout}
            onCancel={() => setShowConfirmLogout(false)}
          />
        )}

        {message && (
          <MessagePopup
            message={message}
            onClose={() => setMessage(null)}
            duration={3000}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="es">
      <body
        className="min-h-screen"
        style={{
          "--color-primary": "#F9C3A4",
          "--color-secondary": "#DCDAD9",
          "--color-accent": "#95999E",
          "--color-background": "#161616",
        } as React.CSSProperties}
      >
        <div className="bg-[var(--color-background)] text-[var(--color-secondary)] min-h-screen">
          <ToastProvider>
            <MediaModalProvider>
              <LayoutContent 
                isAdminRoute={isAdminRoute}
                isLoginOpen={isLoginOpen}
                setIsLoginOpen={setIsLoginOpen}
                message={message}
                setMessage={setMessage}
              >
                {children}
              </LayoutContent>
            </MediaModalProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}