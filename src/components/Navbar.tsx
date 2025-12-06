"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

// SVG Icons
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
  const [session, setSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const navItems = [
    { name: "Películas", href: "/category/peliculas" },
    { name: "Series", href: "/category/series" },
    { name: "Anime", href: "/category/anime" },
    { name: "Novelas", href: "/category/novelas" },
    { name: "Reality", href: "/category/reality" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md text-white border-b border-gray-700 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {!isSearchVisible && (
          <a href="/" className="text-3xl font-extrabold text-indigo-500 hover:text-indigo-400 transition">
            STREAM
          </a>
        )}

        <div className="hidden md:flex items-center space-x-6 text-sm">
          {navItems.map((item) => (
            <a key={item.name} href={item.href} className="hover:text-indigo-400 transition">
              {item.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className={`relative transition-all duration-300 ${isSearchVisible ? "w-full sm:w-64" : "hidden md:block w-64"}`}
          >
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-10 pl-10 pr-10 rounded-full bg-gray-800/70 border border-gray-600 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute top-0 left-3 h-full flex items-center text-gray-400 hover:text-indigo-400 transition">
              <SearchIcon size={18} />
            </button>
            {isSearchVisible && (
              <button type="button" onClick={() => setIsSearchVisible(false)} className="absolute top-0 right-3 h-full flex items-center text-gray-400 hover:text-red-400 transition md:hidden">
                <XIcon size={18} />
              </button>
            )}
          </form>

          {!isSearchVisible && (
            <button onClick={() => setIsSearchVisible(true)} className="md:hidden p-2 rounded-full hover:bg-gray-700 transition">
              <SearchIcon />
            </button>
          )}

          {/* Login / Logout Desktop */}
          {session ? (
            <button onClick={handleLogout} className="hidden sm:flex p-2 rounded-full hover:bg-gray-700 transition">
              <LogoutIcon size={24} />
            </button>
          ) : (
            <button onClick={onOpenLogin} className="hidden sm:flex p-2 rounded-full hover:bg-gray-700 transition">
              <UserIcon size={24} />
            </button>
          )}

          {/* Login / Logout Mobile */}
          {session ? (
            <button onClick={handleLogout} className="sm:hidden p-2 rounded-full hover:bg-gray-700 transition">
              <LogoutIcon size={24} />
            </button>
          ) : (
            <button onClick={onOpenLogin} className="sm:hidden p-2 rounded-full hover:bg-gray-700 transition">
              <UserIcon size={24} />
            </button>
          )}

          {!isSearchVisible && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-700 transition">
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? "max-h-screen py-2" : "max-h-0"}`}>
        <div className="px-3 space-y-1">
          {navItems.map((item) => (
            <a key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              {item.name}
            </a>
          ))}

          {session ? (
            <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="w-full mt-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex justify-center">
              <LogoutIcon size={20} />
            </button>
          ) : (
            <button onClick={() => { onOpenLogin(); setIsMenuOpen(false); }} className="w-full mt-2 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex justify-center">
              <UserIcon size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
