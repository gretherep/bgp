"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  // Mostrar resumen más limpio
  const displayText = selected.length === 0
    ? "Seleccionar..."
    : selected.length === 1
    ? selected[0]
    : `${selected.length} seleccionados`;

  return (
    <div className="relative w-full" ref={ref}>
      <label className="block text-xs font-medium text-gray-400 uppercase mb-1">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg flex justify-between items-center hover:bg-gray-600 transition text-left"
      >
        <span className="truncate text-sm">{displayText}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`w-full flex justify-between items-center px-3 py-2 text-sm text-left hover:bg-gray-700 transition ${
                selected.includes(option) ? "bg-gray-700" : ""
              }`}
            >
              <span className="text-white">{option}</span>
              {selected.includes(option) && (
                <Check className="w-4 h-4 text-amber-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}