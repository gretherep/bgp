"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface MessagePopupProps {
  message: string;
  onClose: () => void;
  duration?: number; // ms
}

// MessagePopup.tsx
const MessagePopup: React.FC<MessagePopupProps> = ({ message, onClose, duration = 3000 }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.8 }} // Pequeña animación desde arriba
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        // CAMBIO: fixed en lugar de absolute y z-index muy alto (z-[100])
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                   bg-[var(--color-primary)] text-black px-8 py-4 rounded-2xl 
                   shadow-2xl z-[100] font-bold text-lg min-w-[300px] text-center"
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
};

export default MessagePopup;
