"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import PedidoFlotante from "@/components/pedido/PedidoFlotante";
import { MediaModalProvider } from "@/app/context/MediaModalContext";
import { ToastProvider, useToast } from "@/app/context/ToastContext";

// Se descargan solo al abrirse: login (Supabase) y popups (framer-motion) no pesan en la carga inicial.
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });
const ConfirmPopup = dynamic(() => import("@/components/ConfirmPopup"), { ssr: false });
const MessagePopup = dynamic(() => import("@/components/MessagePopup"), { ssr: false });

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const { showToast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleFinalLogout = async () => {
    try {
      const { supabase } = await import("@/utils/supabaseClient");
      const { error } = await supabase.auth.signOut({ scope: "local" }); // solo este dispositivo
      if (error) throw error;
      showToast("¡Has cerrado sesión con éxito!", false);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
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

      {isLoginOpen && <LoginModal isOpen onClose={() => setIsLoginOpen(false)} />}

      <main className={`min-h-screen ${isAdminRoute ? "pt-0" : "pt-16"}`}>{children}</main>

      {!isAdminRoute && <PedidoFlotante />}

      {showConfirmLogout && (
        <ConfirmPopup
          message="¿Seguro que quieres cerrar sesión?"
          onConfirm={handleFinalLogout}
          onCancel={() => setShowConfirmLogout(false)}
        />
      )}
      {message && <MessagePopup message={message} onClose={() => setMessage(null)} duration={3000} />}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MediaModalProvider>
        <ShellContent>{children}</ShellContent>
      </MediaModalProvider>
    </ToastProvider>
  );
}
