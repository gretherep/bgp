"use client";

import { useEffect, useState } from "react";
import { PricingCategory } from "@/app/models/pricingCategory";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [info, setInfo] = useState<any>(null);
  const [pricing, setPricing] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [infoRes, pricingRes] = await Promise.all([
          fetch("/api/descripcion"),
          fetch("/api/pricing-categories")
        ]);
        const infoData = await infoRes.json();
        const pricingData = await pricingRes.json();
        setInfo(infoData);
        setPricing(pricingData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#161616ff] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#F9C3A4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div 
      className="bg-[var(--color-background)] min-h-screen text-[var(--color-secondary)] overflow-x-hidden"
      style={{
        "--color-primary": "#F9C3A4",
        "--color-secondary": "#DCDAD9",
        "--color-accent": "#95999E",
        "--color-background": "#161616ff",
      } as React.CSSProperties}
    >
      
      {/* 🎬 HEADER */}
     {/* 🎭 HEADER / BANNER ANIMADO */}
<section className="relative pt-32 pb-16 overflow-hidden">
  {/* Fondo con luces animadas */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.3, 0.2] 
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[120px]" 
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.3, 1],
        opacity: [0.1, 0.2, 0.1] 
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute bottom-0 right-[0%] w-[40%] h-[50%] rounded-full bg-blue-500 blur-[100px]" 
    />
  </div>

  <div className="max-w-4xl mx-auto px-6 text-center">
    {/* Logo con efecto de levitación */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {info?.image_url && (
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative inline-block mb-8"
        >
          {/* Brillo detrás del logo */}
          <div className="absolute inset-0 bg-[var(--color-primary)] blur-3xl opacity-20" />
          <img
            src={info.image_url}
            alt="Logo"
            className="relative w-28 h-28 mx-auto rounded-[2.5rem] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover"
          />
        </motion.div>
      )}
      
      {/* Título con aparición suave */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-white"
      >
        {info?.title?.split(" ").map((word: string, i: number) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
            className="inline-block mr-3"
          >
            {word}
          </motion.span>
        )) ?? "Catálogo Digital"}
      </motion.h1>

      {/* Subtítulo con línea expansiva */}
      <div className="flex flex-col items-center">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-[var(--color-primary)] font-bold tracking-[0.4em] uppercase text-xs mb-4"
        >
          Tarifas por Categoría
        </motion.p>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "80px" }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent"
        />
      </div>
    </motion.div>
  </div>
</section>

      {/* 📖 DESCRIPCIÓN */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-10 backdrop-blur-sm"
        >
          <h2 className="text-lg font-black mb-4 text-white uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[var(--color-primary)]"></span>
            Sobre Nosotros
          </h2>
          <p className="text-[var(--color-secondary)]/80 leading-relaxed whitespace-pre-line text-base md:text-lg">
            {info?.description}
          </p>
        </motion.div>
      </section>

      {/* 🏷️ LISTADO DE PRECIOS */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            NUESTRAS <span className="text-[var(--color-primary)]">TARIFAS</span>
          </h2>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pricing
            .filter(p => p.is_active)
            .sort((a, b) => a.display_order - b.display_order)
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative bg-white/[0.03] border border-white/5 hover:border-[var(--color-primary)]/30 rounded-[1.8rem] p-6 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-black text-[var(--color-accent)] group-hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
                    {item.category}
                  </h3>
                  <span className="text-[var(--color-primary)] text-xs">★</span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-white">
                    {item.price}
                  </span>
                  <span className="text-[var(--color-primary)] text-sm font-bold uppercase">
                    {item.currency}
                  </span>
                </div>

                {item.description && (
                  <p className="text-[var(--color-accent)] text-xs leading-relaxed border-t border-white/5 pt-4 italic">
                    {item.description}
                  </p>
                )}
              </motion.div>
            ))}
        </div>
      </section>

      {/* 🔗 CONTACTO */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent p-8 rounded-[2.5rem] border border-[var(--color-primary)]/10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-black text-white mb-2">¿Tienes dudas?</h3>
            <p className="text-[var(--color-accent)] text-sm font-medium">Contáctanos por nuestras vías oficiales.</p>
          </div>
          
          <div className="flex gap-4">
            {info?.whatsapp_url && (
              <a
                href={info.whatsapp_url}
                target="_blank"
                className="w-12 h-12 flex items-center justify-center bg-[#25D366] text-black rounded-xl hover:scale-110 transition-transform shadow-lg shadow-green-500/20"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.89 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.743-.981z"/>
                </svg>
              </a>
            )}

            {info?.telegram_url && (
              <a
                href={info.telegram_url}
                target="_blank"
                className="w-12 h-12 flex items-center justify-center bg-[#0088cc] text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-blue-500/20"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.263l-1.912 9.03c-.14.64-.52.8-.105.416l-2.912-2.146-1.405 1.352c-.158.158-.29.29-.595.29l.208-2.952 5.374-4.852c.234-.208-.05-.323-.362-.115l-6.642 4.18-2.863-.895c-.622-.195-.633-.622.13-.917l11.192-4.313c.52-.195.975.115.795.862z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}