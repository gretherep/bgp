// app/layout.tsx
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
import { ToastProvider } from "./context/ToastContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="en">
      <body
        className="min-h-screen"
        style={{
          "--color-primary": "#F9C3A4",
          "--color-secondary": "#DCDAD9",
          "--color-accent": "#95999E",
          "--color-background": "rgba(0, 0, 0, 0.9)",
        } as React.CSSProperties}
      >
        <div className="bg-[var(--color-background)] text-[var(--color-secondary)] min-h-screen">
          <ToastProvider>
            <MediaModalProvider>
              {!isAdminRoute && <Navbar onOpenLogin={() => setIsLoginOpen(true)} />}
              <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
              />
              <main>{children}</main>
            </MediaModalProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}