// components/FilterSidebar.tsx
"use client";

import { useState, useEffect, RefObject, createRef } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSidebarProps {
  // Inputs de texto
  textInputs?: {
    key: string;
    label: string;
    value: string;
  }[];
  
  // Select simple (años)
  singleSelects?: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
  }[];
  
  // MultiSelect con chips
  multiSelects?: {
    key: string;
    label: string;
    value: string[];
    options: FilterOption[];
  }[];
  
  onApply: (filters: Record<string, string | string[]>) => void;
  onReset: () => void;
  
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function FilterSidebar({
  textInputs = [],
  singleSelects = [],
  multiSelects = [],
  onApply,
  onReset,
  isMobile = false,
  onCloseMobile
}: FilterSidebarProps) {
  // Estados locales
  const [localTextInputs, setLocalTextInputs] = useState<Record<string, string>>(
    textInputs.reduce((acc, input) => ({ ...acc, [input.key]: input.value }), {})
  );
  
  const [localSingleSelects, setLocalSingleSelects] = useState<Record<string, string>>(
    singleSelects.reduce((acc, filter) => ({ ...acc, [filter.key]: filter.value }), {})
  );
  
  const [localMultiSelects, setLocalMultiSelects] = useState<Record<string, string[]>>(
    multiSelects.reduce((acc, filter) => ({ ...acc, [filter.key]: filter.value }), {})
  );

  // Estados para dropdowns
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownRefs: Record<string, RefObject<HTMLDivElement | null>> = {};

  // Generar opciones de años (2000 - actual)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear; year++) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  // Crear refs para dropdowns
  const allFilterKeys = [
    ...singleSelects.map(f => f.key),
    ...multiSelects.map(f => f.key)
  ];
  
  allFilterKeys.forEach(key => {
    if (!dropdownRefs[key]) {
      dropdownRefs[key] = createRef<HTMLDivElement>();
    }
  });

  // Manejar clics fuera de dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      allFilterKeys.forEach(key => {
        const ref = dropdownRefs[key];
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [allFilterKeys]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSingleSelect = (key: string, value: string) => {
    setLocalSingleSelects(prev => ({ ...prev, [key]: value }));
    setOpenDropdowns(prev => ({ ...prev, [key]: false }));
  };

  const handleMultiSelect = (key: string, value: string) => {
    setLocalMultiSelects(prev => {
      const current = prev[key] || [];
      const newValues = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: newValues };
    });
  };

  const removeMultiSelect = (key: string, value: string) => {
    setLocalMultiSelects(prev => {
      const current = prev[key] || [];
      return { ...prev, [key]: current.filter(v => v !== value) };
    });
  };

  const handleApply = () => {
    const allFilters = {
      ...localTextInputs,
      ...localSingleSelects,
      ...localMultiSelects
    };
    onApply(allFilters);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleReset = () => {
    // Resetear a valores iniciales
    const initialText = textInputs.reduce((acc, input) => 
      ({ ...acc, [input.key]: input.value }), {});
    const initialSingle = singleSelects.reduce((acc, filter) => 
      ({ ...acc, [filter.key]: filter.value }), {});
    const initialMulti = multiSelects.reduce((acc, filter) => 
      ({ ...acc, [filter.key]: filter.value }), {});
    
    setLocalTextInputs(initialText);
    setLocalSingleSelects(initialSingle);
    setLocalMultiSelects(initialMulti);
    onReset();
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  // Renderizar Input de Texto
  const renderTextInput = (input: typeof textInputs[0]) => (
    <div key={input.key}>
      <label className="block text-xs font-medium uppercase mb-2" style={{ color: 'var(--color-accent)' }}>
        {input.label}
      </label>
      <input
        type="text"
        placeholder={`Buscar ${input.label.toLowerCase()}...`}
        value={localTextInputs[input.key] || ""}
        onChange={(e) => setLocalTextInputs(prev => ({ ...prev, [input.key]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-lg transition-colors"
        style={{
          backgroundColor: 'rgba(149, 153, 158, 0.15)',
          border: '1px solid rgba(149, 153, 158, 0.3)',
          color: 'var(--color-secondary)',
        }}
      />
    </div>
  );

  // Renderizar Select Simple (Años)
  const renderSingleSelect = (filter: typeof singleSelects[0]) => {
    const isOpen = openDropdowns[filter.key] || false;
    const selectedOption = filter.options.find(opt => opt.value === localSingleSelects[filter.key]);
    const displayText = selectedOption ? selectedOption.label : `Seleccionar ${filter.label.toLowerCase()}`;

    return (
      <div key={filter.key} className="relative" ref={dropdownRefs[filter.key]}>
        <label className="block text-xs font-medium uppercase mb-2" style={{ color: 'var(--color-accent)' }}>
          {filter.label}
        </label>
        <button
          type="button"
          onClick={() => toggleDropdown(filter.key)}
          className="w-full px-3 py-2.5 rounded-lg text-left transition-colors"
          style={{
            backgroundColor: 'rgba(149, 153, 158, 0.15)',
            border: '1px solid rgba(149, 153, 158, 0.3)',
            color: localSingleSelects[filter.key] ? 'var(--color-secondary)' : 'rgba(220, 218, 217, 0.7)',
          }}
        >
          {displayText}
        </button>
        
        {isOpen && (
          <div 
            className="absolute left-0 right-0 mt-1 w-full z-50 max-h-48 overflow-y-auto rounded-lg shadow-xl"
            style={{ 
              backgroundColor: 'var(--color-background)',
              border: '1px solid rgba(149, 153, 158, 0.3)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <button
              type="button"
              onClick={() => handleSingleSelect(filter.key, "")}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                color: !localSingleSelects[filter.key] ? 'var(--color-secondary)' : 'var(--color-accent)',
                backgroundColor: !localSingleSelects[filter.key] ? 'rgba(249, 195, 164, 0.15)' : 'transparent',
              }}
            >
              Todos los {filter.label.toLowerCase()}
            </button>
            {filter.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSingleSelect(filter.key, option.value)}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  color: localSingleSelects[filter.key] === option.value ? 'var(--color-secondary)' : 'var(--color-accent)',
                  backgroundColor: localSingleSelects[filter.key] === option.value ? 'rgba(249, 195, 164, 0.15)' : 'transparent',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar MultiSelect con Chips
  const renderMultiSelect = (filter: typeof multiSelects[0]) => {
    const isOpen = openDropdowns[filter.key] || false;
    const currentValues = localMultiSelects[filter.key] || [];
    
    return (
      <div key={filter.key} className="relative" ref={dropdownRefs[filter.key]}>
        <label className="block text-xs font-medium uppercase mb-2" style={{ color: 'var(--color-accent)' }}>
          {filter.label}
        </label>
        
        {/* Chips de selección */}
        <div className="min-h-[42px] w-full px-2 py-1.5 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 flex flex-wrap gap-1.5 items-center">
          {currentValues.length > 0 ? (
            currentValues.map((value) => {
              const option = filter.options.find(opt => opt.value === value);
              return (
                <div 
                  key={value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(249, 195, 164, 0.2)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {option?.label || value}
                  <button
                    type="button"
                    onClick={() => removeMultiSelect(filter.key, value)}
                    className="ml-1 hover:bg-[var(--color-primary)]/20 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          ) : (
            <span className="text-[var(--color-accent)] text-sm opacity-70">
              Seleccionar {filter.label.toLowerCase()}...
            </span>
          )}
          
          <button
            type="button"
            onClick={() => toggleDropdown(filter.key)}
            className="ml-auto p-1 rounded-full hover:bg-[var(--color-accent)]/20"
          >
            <ChevronDown className="w-4 h-4 text-[var(--color-accent)]" />
          </button>
        </div>
        
        {isOpen && (
          <div 
            className="absolute left-0 right-0 mt-1 w-full z-50 max-h-60 overflow-y-auto rounded-lg shadow-xl"
            style={{ 
              backgroundColor: 'var(--color-background)',
              border: '1px solid rgba(149, 153, 158, 0.3)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {filter.options.map((option) => {
              const isSelected = currentValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMultiSelect(filter.key, option.value)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors flex justify-between items-center"
                  style={{
                    color: isSelected ? 'var(--color-secondary)' : 'var(--color-accent)',
                    backgroundColor: isSelected ? 'rgba(249, 195, 164, 0.15)' : 'transparent',
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Contenido del panel
  const filterContent = (
    <div className="space-y-4">
      {textInputs.map(renderTextInput)}
      {singleSelects.map(renderSingleSelect)}
      {multiSelects.map(renderMultiSelect)}
      
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 py-2 px-3 rounded-lg text-sm transition"
          style={{
            backgroundColor: 'rgba(149, 153, 158, 0.2)',
            color: 'var(--color-secondary)'
          }}
        >
          Limpiar
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-background)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8b293'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
        >
          Aplicar
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div 
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={onCloseMobile}
        ></div>
        
        <motion.div
          className="fixed right-0 top-0 h-full z-50 w-80 max-w-[90vw]"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div 
            className="h-full flex flex-col"
            style={{ 
              backgroundColor: 'rgba(22, 18, 20, 0.98)',
              backdropFilter: 'blur(12px)',
              borderLeft: '1px solid rgba(149, 153, 158, 0.3)'
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'rgba(149, 153, 158, 0.2)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                  </svg>
                  Filtros
                </h3>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-full"
                  style={{ 
                    backgroundColor: 'rgba(149, 153, 158, 0.2)',
                    color: 'var(--color-secondary)'
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filterContent}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <aside className="lg:w-64 flex-shrink-0">
      <div 
        className="p-5 rounded-xl"
        style={{ 
          backgroundColor: 'rgba(149, 153, 158, 0.1)',
          border: '1px solid rgba(149, 153, 158, 0.3)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--color-primary)' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.882a1 1 0 01-.76 1.057l-2.983.596A1 1 0 018 20.5v-5.882a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z"
            />
          </svg>
          Filtros
        </h3>
        {filterContent}
      </div>
    </aside>
  );
}