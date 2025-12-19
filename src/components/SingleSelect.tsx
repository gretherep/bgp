"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SingleSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SingleSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
}: SingleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <label className="block mb-1 text-xs uppercase tracking-wide text-accent">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full flex items-center justify-between
          rounded-xl px-4 py-2.5 text-sm
          border transition
          ${value
            ? "bg-background text-secondary border-primary/40"
            : "bg-background/70 text-accent border-accent/30"}
          hover:border-primary/60
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180 text-primary" : "text-accent"
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute z-50 mt-1 w-full overflow-hidden
          rounded-xl border border-accent/30
          bg-background shadow-2xl
        ">
          {/* Placeholder */}
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`
              w-full px-4 py-2 text-left text-sm flex justify-between
              transition
              ${!value
                ? "bg-primary/15 text-secondary"
                : "text-accent hover:bg-accent/10"}
            `}
          >
            {placeholder}
            {!value && <Check className="w-4 h-4 text-primary" />}
          </button>

          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-left text-sm flex justify-between
                transition
                ${value === opt.value
                  ? "bg-primary/20 text-secondary"
                  : "text-secondary hover:bg-accent/10"}
              `}
            >
              {opt.label}
              {value === opt.value && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
