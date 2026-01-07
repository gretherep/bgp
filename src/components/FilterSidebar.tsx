"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, Filter } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface FilterSidebarProps {
  segmentedFilters?: { key: string; label: string; value: string; options: Option[] }[];
  singleSelects?: { key: string; label: string; value: string; options: Option[] }[];
  multiSelects?: { key: string; label: string; value: string[]; options: Option[] }[];
  onApply: (filters: any) => void;
  onReset: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function FilterSidebar({
  segmentedFilters = [],
  singleSelects = [],
  multiSelects = [],
  onApply,
  onReset,
  isMobile = false,
  onCloseMobile,
}: FilterSidebarProps) {
  
  // 1. Estados inicializados con los valores actuales de las props
  const [localSegmented, setLocalSegmented] = useState<Record<string, string>>({});
  const [localSingle, setLocalSingle] = useState<Record<string, string>>({});
  const [localMulti, setLocalMulti] = useState<Record<string, string[]>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // 2. SINCRONIZACIÓN SEGURA (Sin bucle infinito)
  // Usamos JSON.stringify para comparar el CONTENIDO y no la referencia de memoria
  const deps = JSON.stringify({ segmentedFilters, singleSelects, multiSelects });

  useEffect(() => {
    const seg: any = {};
    segmentedFilters.forEach((f) => (seg[f.key] = f.value || "todo"));
    setLocalSegmented(seg);

    const sin: any = {};
    singleSelects.forEach((f) => (sin[f.key] = f.value || ""));
    setLocalSingle(sin);

    const mul: any = {};
    multiSelects.forEach((f) => (mul[f.key] = f.value || []));
    setLocalMulti(mul);
  }, [deps]); // Solo se dispara si el string cambia

  // 3. LÓGICA DE HISTORIAL PARA MÓVIL
  useEffect(() => {
    if (isMobile) {
      window.history.pushState({ sidebarOpen: true }, "");
      const handlePopState = () => { if (onCloseMobile) onCloseMobile(); };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.sidebarOpen) window.history.back();
      };
    }
  }, [isMobile, onCloseMobile]);

  const handleApply = () => {
    onApply({ ...localSegmented, ...localSingle, ...localMulti });
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const handleReset = () => {
    onReset();
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const toggleOption = (key: string, value: string) => {
    const current = localMulti[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setLocalMulti(prev => ({ ...prev, [key]: next }));
  };

  const SidebarContent = (
    <div className={`flex flex-col h-full bg-[#1A1A1A] ${isMobile ? 'rounded-l-[2.5rem]' : 'rounded-[2.5rem] border border-white/5'} p-6 shadow-2xl overflow-y-auto no-scrollbar`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Filtros</h3>
        </div>
        {isMobile && (
          <button onClick={onCloseMobile} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <div className="space-y-8">
        {segmentedFilters.map((group) => (
          <div key={group.key} className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--color-accent)]">{group.label}</span>
            <div className="flex bg-black/40 rounded-xl p-1 gap-1 border border-white/5">
              {group.options.map((opt) => {
                const isActive = (localSegmented[group.key] || "todo") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLocalSegmented(prev => ({ ...prev, [group.key]: opt.value }))}
                    className={`relative flex-1 py-2.5 text-[11px] font-bold rounded-lg transition-all ${isActive ? "text-black" : "text-white/40"}`}
                  >
                    {isActive && <motion.div layoutId={`tab-${group.key}`} className="absolute inset-0 bg-[var(--color-primary)] rounded-lg" />}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {singleSelects.map((group) => (
          <div key={group.key} className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--color-accent)]">{group.label}</span>
            <div className="relative">
              <select
                value={localSingle[group.key] || ""}
                onChange={(e) => setLocalSingle(prev => ({ ...prev, [group.key]: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white appearance-none focus:outline-none"
              >
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1A1A1A]">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
            </div>
          </div>
        ))}

        {multiSelects.map((group) => (
          <div key={group.key} className="space-y-3 relative">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--color-accent)]">{group.label}</span>
            <div 
              onClick={() => setActiveDropdown(activeDropdown === group.key ? null : group.key)}
              className="min-h-[50px] w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer"
            >
              {(localMulti[group.key] || []).map((val) => {
                const label = group.options.find(o => o.value === val)?.label || val;
                return (
                  <span key={val} className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-primary)] text-black rounded-lg text-[10px] font-black">
                    {label} <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); toggleOption(group.key, val); }} />
                  </span>
                );
              })}
              {(!localMulti[group.key] || localMulti[group.key].length === 0) && <span className="text-xs text-white/20">Seleccionar...</span>}
              <ChevronDown className="ml-auto w-4 h-4 text-white/20" />
            </div>
            {/* Dropdown de multiSelect (igual al anterior) */}
            <AnimatePresence>
              {activeDropdown === group.key && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-[110] w-full mt-2 bg-[#222] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2">
                  {group.options.map((opt) => {
                    const isSelected = (localMulti[group.key] || []).includes(opt.value);
                    return (
                      <div key={opt.value} onClick={() => toggleOption(group.key, opt.value)} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer">
                        <span className={`text-xs ${isSelected ? 'text-[var(--color-primary)] font-bold' : 'text-white/60'}`}>{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <div className="flex flex-col gap-3 pt-6 border-t border-white/5 pb-10">
          <button onClick={handleApply} className="w-full py-4 px-6 rounded-2xl text-[12px] font-black uppercase tracking-[2px] bg-[var(--color-primary)] text-[#161214] font-bold shadow-xl">
            APLICAR FILTROS
          </button>
          <button onClick={handleReset} className="w-full py-3 text-[10px] font-bold uppercase tracking-[1px] opacity-50 text-white">
            Limpiar Selección
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[110] flex justify-end bg-black/80 backdrop-blur-sm" onClick={() => setActiveDropdown(null)}>
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-[85%] max-w-sm h-full" onClick={(e) => e.stopPropagation()}>
          {SidebarContent}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-72 sticky top-32 h-[calc(100vh-160px)]" onMouseLeave={() => setActiveDropdown(null)}>
      {SidebarContent}
    </div>
  );
}