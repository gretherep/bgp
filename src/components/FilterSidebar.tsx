"use client";

import { useState, Dispatch, SetStateAction } from "react";

interface FilterSidebarProps {
  year: number | "";
  setYear: Dispatch<SetStateAction<number | "">>;
  genre: string;
  setGenre: Dispatch<SetStateAction<string>>;
  resetFilters: () => void;
  availableYears: number[];
  availableGenres: string[];
}

export default function FilterSidebar({
  year,
  setYear,
  genre,
  setGenre,
  resetFilters,
  availableYears,
  availableGenres,
}: FilterSidebarProps) {
  return (
    <aside 
      className="lg:w-64 p-4 bg-[var(color-secondary)]/10 rounded-xl shadow-lg lg:sticky lg:top-8 h-fit border border-[var(color-secondary)]/30 transition duration-300"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <h3 className="text-lg font-bold text-[var(--color-primary)] mb-4 pb-2 border-b border-[var(--color-accent)]/30 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
        </svg>
        Filtros
      </h3>
      
      <div className="space-y-4">
        {/* Año */}
        <div>
          <label htmlFor="year" className="block text-xs font-medium text-[var(--color-accent)] uppercase mb-1">
            Año
          </label>
          <select
            id="year"
            className="w-full bg-[var(--color-accent)]/20 text-[var(--color-secondary)] rounded-lg py-2 px-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] border border-[var(--color-accent)]/30 outline-none transition"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="" className="bg-[var(--color-background)]">Todos</option>
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-[var(--color-background)]">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div>
          <label htmlFor="genre" className="block text-xs font-medium text-[var(--color-accent)] uppercase mb-1">
            Género
          </label>
          <select
            id="genre"
            className="w-full bg-[var(--color-accent)]/20 text-[var(--color-secondary)] rounded-lg py-2 px-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] border border-[var(--color-accent)]/30 outline-none transition"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="" className="bg-[var(--color-background)]">Todos</option>
            {availableGenres.map((g) => (
              <option key={g} value={g} className="bg-[var(--color-background)]">
                {g}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={resetFilters}
          className="w-full bg-[var(--color-primary)] hover:bg-[#e8b293] text-[var(--color-background)] font-medium py-2 px-4 rounded-lg transition duration-200 shadow-md"
        >
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}