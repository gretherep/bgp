"use client";
import { motion } from "framer-motion";
import { Bike } from "lucide-react";

export default function LoadingBike() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0e0e0e]">
      <motion.div
        animate={{ 
          x: [-20, 20, -20],
          rotate: [-5, 5, -5]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="text-[var(--color-primary)]"
      >
        <Bike size={64} strokeWidth={1.5} />
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
        className="mt-4 text-[10px] font-black tracking-[0.3em] uppercase text-white/40"
      >
        Cargando contenido...
      </motion.p>
    </div>
  );
}