"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation"; // ✅ Nuevo hook
import { supabase } from "@/utils/supabaseClient";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

// SVG Icons (sin cambios)
interface IconProps { size?: number; className?: string; }

const MenuIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const XIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const SearchIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const UserIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
    <path d="M7 8v8" />
  </svg>
);

interface NavbarProps {
  onOpenLogin: () => void;
}

export default function Navbar({ onOpenLogin }: NavbarProps) {
  const pathname = usePathname(); // ✅ Obtiene la ruta actual
  const [session, setSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const navItems = [
    { name: "Inicio", href: "/" },
    { name: "Películas", href: "/category/peliculas" },
    { name: "Series", href: "/category/series" },
    { name: "Anime", href: "/category/anime" },
    { name: "Novelas", href: "/category/novelas" },
    { name: "Reality", href: "/category/reality" },
    { name: "Descripcion", href: "/descripcion" },
  ];

  // ---------- Supabase Auth ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    window.location.href = `/search?query=${encodeURIComponent(searchTerm.trim())}`;
    setSearchTerm("");
    setIsSearchVisible(false);
  };

  // ✅ Función para verificar si un ítem está activo
  const isActive = (href: string) => {
    // Para rutas de categoría: "/category/peliculas" debe coincidir con pathname "/category/peliculas"
    if (href.startsWith('/category/')) {
      return pathname === href;
    }
    // Para "/descripcion"
    if (href === '/descripcion') {
      return pathname === href;
    }
     if (href === '/') {
      return pathname === href;
    }
    return false;
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 shadow-lg"
      style={{ 
        backgroundColor: '#212121ff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--color-secondary)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        {!isSearchVisible && (
          <a href="/" className="flex items-center">
            <Image
              src="/images/Logo.png"
              alt="Logo"
              width={80}
              height={22}
              className="object-contain"
            />
          </a>
        )}

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`transition-colors relative ${
                isActive(item.href) 
                  ? 'text-[var(--color-primary)] font-semibold' 
                  : 'hover:text-[var(--color-primary)]'
              }`}
            >
              {item.name}
              {isActive(item.href) && (
                <div 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                ></div>
              )}
            </a>
          ))}
        </div>

        {/* Acciones: búsqueda, login/logout, menú móvil */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className={`relative transition-all duration-300 ${isSearchVisible ? "w-full sm:w-64" : "hidden md:block w-64"}`}
          >
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-10 pl-10 pr-10 rounded-full transition"
              style={{
                backgroundColor: 'rgba(220, 218, 217, 0.1)',
                border: '1px solid rgba(149, 153, 158, 0.3)',
                color: 'var(--color-secondary)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute top-0 left-3 h-full flex items-center"
              style={{ color: 'var(--color-accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
            >
              <SearchIcon size={18} />
            </button>
            {isSearchVisible && (
              <button
                type="button"
                onClick={() => setIsSearchVisible(false)}
                className="absolute top-0 right-3 h-full flex items-center md:hidden"
                style={{ color: 'var(--color-accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
              >
                <XIcon size={18} />
              </button>
            )}
          </form>

          {!isSearchVisible && (
            <button
              onClick={() => setIsSearchVisible(true)}
              className="md:hidden p-2 rounded-full transition"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(149, 153, 158, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <SearchIcon />
            </button>
          )}

          {/* Login / Logout */}
          {session ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition md:ml-2"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(149, 153, 158, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogoutIcon size={24} />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="p-2 rounded-full transition md:ml-2"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(149, 153, 158, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserIcon size={24} />
            </button>
          )}

          {/* Menu Móvil */}
          {!isSearchVisible && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full transition"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(149, 153, 158, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? "max-h-screen py-2" : "max-h-0"}`}
        style={{ backgroundColor: 'rgba(22, 18, 20, 0.95)' }}
      >
        <div className="px-3 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-secondary)] hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-primary)]'
              }`}
            >
              {item.name}
            </a>
          ))}

          {session ? (
            <button
              onClick={() => { setIsMenuOpen(false); handleLogout(); }}
              className="w-full mt-2 px-3 py-2 rounded-md transition-colors flex justify-center"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-background)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8b293'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <LogoutIcon size={20} />
            </button>
          ) : (
            <button
              onClick={() => { onOpenLogin(); setIsMenuOpen(false); }}
              className="w-full mt-2 px-3 py-2 rounded-md transition-colors flex justify-center"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-background)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8b293'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <UserIcon size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}