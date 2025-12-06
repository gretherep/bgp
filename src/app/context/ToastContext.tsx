// context/ToastContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import Toast from '@/components/Toast'; // Asegúrate que la ruta sea correcta

interface ToastState {
  message: string | null;
  isError: boolean;
}

interface ToastContextType {
  showToast: (message: string, isError: boolean, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Valor por defecto de la duración del toast (en milisegundos)
const DEFAULT_DURATION = 3000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({ message: null, isError: false });
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  
  // Limpiar el toast automáticamente
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: null, isError: false });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast, duration]);

  // Función para mostrar el toast desde cualquier componente
  const showToast = useCallback((message: string, isError: boolean, customDuration: number = DEFAULT_DURATION) => {
    setDuration(customDuration);
    setToast({ message, isError });
  }, []);

  const handleClose = useCallback(() => {
    setToast({ message: null, isError: false });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Renderizar el componente Toast si hay un mensaje */}
      {toast.message && (
        <Toast 
          message={toast.message} 
          isError={toast.isError} 
          onClose={handleClose} 
        />
      )}
    </ToastContext.Provider>
  );
};

// Hook personalizado para usar el toast fácilmente
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};