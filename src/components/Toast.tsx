// components/Toast.tsx
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import React from 'react';

interface ToastProps {
  message: string;
  isError: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isError, onClose }) => {
  return (
    <div 
      // Fijo en la esquina superior derecha
      className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg flex items-center shadow-2xl max-w-sm w-full 
        transition-opacity duration-300 transform animate-slideIn ${
          isError 
            ? 'bg-red-700 text-white border-red-500 border-l-4' 
            : 'bg-green-600 text-white border-green-500 border-l-4'
        }`}
    >
      {isError ? <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
      
      <span className="font-medium text-sm flex-grow">{message}</span>
      
      {/* Botón para cerrar el toast */}
      <button 
        onClick={onClose} 
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;