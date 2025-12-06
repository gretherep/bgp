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
    <aside className="lg:w-64 p-4 bg-gray-800 rounded-xl shadow-xl lg:sticky lg:top-8 h-fit border border-gray-700/70 transition duration-300">
      <h3 className="text-xl font-bold text-white mb-4 border-b pb-2 border-purple-500/50">🔍 Filtros</h3>
      <div className="space-y-4">
        {/* Año */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">Año</label>
          <select
            id="year"
            className="w-full bg-gray-700 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 border border-transparent hover:border-purple-500 transition duration-150"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Todos</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-1">Género</label>
          <select
            id="genre"
            className="w-full bg-gray-700 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 border border-transparent hover:border-purple-500 transition duration-150"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">Todos</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button
          onClick={resetFilters}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-purple-500/50 mt-4"
        >
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}
