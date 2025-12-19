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

  const displayText = selected.length === 0
    ? "Seleccionar..."
    : selected.length === 1
    ? selected[0]
    : `${selected.length} seleccionados`;

  return (
    <div className="relative w-full" ref={ref}>
      <label className="block text-xs font-medium text-[var(--color-accent)] uppercase mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-[var(--color-secondary)] px-3 py-2 rounded-lg flex justify-between items-center hover:bg-[var(--color-accent)]/30 transition text-left"
      >
        <span className="truncate text-sm">{displayText}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180 text-[var(--color-primary)]" : "text-[var(--color-accent)]"
          }`}
        />
      </button>

      {open && (
        <div 
          className="absolute left-0 right-0 mt-1 w-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`w-full flex justify-between items-center px-3 py-2 text-sm text-left transition ${
                selected.includes(option) 
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-secondary)]' 
                  : 'text-[var(--color-secondary)] hover:bg-[var(--color-accent)]/20'
              }`}
            >
              <span>{option}</span>
              {selected.includes(option) && (
                <Check className="w-4 h-4 text-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}