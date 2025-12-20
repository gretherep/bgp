"use client";

import { useEffect, useState } from "react";
import { PricingCategory } from "@/app/models/pricingCategory";
import { BusinessInfo } from "@/app/models/businessInfo"; // Usamos tu interfaz
import { motion } from "framer-motion";
import ShootingStars from "@/components/ShootingStars";

export default function AboutPage() {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
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

        // 🔍 DEBUG: Mira tu consola del navegador (F12) para ver qué llega aquí
        console.log("Datos de BusinessInfo:", infoData);

        // ✅ CORRECCIÓN DE ESTRUCTURA: 
        // Si infoData es un array, extraemos el primero.
        const businessData = Array.isArray(infoData) ? infoData[0] : infoData;
        
        setInfo(businessData);
        setPricing(pricingData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      
      {/* 🎭 HEADER / BANNER ANIMADO */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <ShootingStars />

        {/* Luces de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[120px]" />
          <div className="absolute bottom-0 right-[0%] w-[40%] h-[50%] rounded-full bg-indigo-600 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* ✅ LOGO: Verificamos si existe image_url */}
            {info?.image_url ? (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative inline-block mb-8"
              >
                <div className="absolute inset-0 bg-[var(--color-primary)] blur-3xl opacity-20" />
                <img
                  src={info.image_url}
                  alt="Logo Business"
                  className="relative w-32 h-32 mx-auto rounded-[2.5rem] border-2 border-white/10 shadow-2xl object-cover"
                />
              </motion.div>
            ) : (
              // Div temporal por si la URL es nula mientras carga
              <div className="w-32 h-32 mx-auto mb-8 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
            )}
            
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-white">
              {info?.title || "Catálogo Digital"}
            </h1>

            <div className="flex flex-col items-center">
              <p className="text-[var(--color-primary)] font-bold tracking-[0.4em] uppercase text-xs mb-4">
                Tarifas y Servicios
              </p>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 📖 SOBRE NOSOTROS */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md"
        >
          <h2 className="text-sm font-black mb-6 text-white uppercase tracking-[0.3em] flex items-center gap-4">
            <span className="w-10 h-[1px] bg-[var(--color-primary)]"></span>
            ¿Quienes Somos?
          </h2>
          <p className="text-[var(--color-secondary)]/70 leading-relaxed text-lg whitespace-pre-line">
            {info?.description || "Cargando información corporativa..."}
          </p>
        </motion.div>
      </section>

      {/* 🏷️ LISTADO DE PRECIOS */}
<section className="max-w-6xl mx-auto px-6 py-10">
  <div className="flex items-center gap-4 mb-12">
    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
      Nuestras <span className="text-[var(--color-primary)]">Tarifas</span>
    </h2>
    <div className="flex-1 h-px bg-white/10"></div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {pricing
      .filter((p) => p.is_active)
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
              {/* Formateo de precio simple */}
              {item.price.toLocaleString()}
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

          {/* Efecto de resplandor al hacer hover */}
          <div className="absolute inset-0 rounded-[1.8rem] bg-[var(--color-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
      ))}
  </div>
</section>

      {/* 🔗 CONTACTO: WhatsApp y Telegram asociados a tu modelo */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent p-10 md:p-16 rounded-[3rem] border border-white/5 text-center">
          
          <h3 className="text-3xl font-black text-white mb-4">¿Listo para empezar?</h3>
          <p className="text-[var(--color-accent)] mb-10 max-w-sm mx-auto">
            Haz clic en tu plataforma preferida y hablemos sobre tu próximo proyecto.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            {/* BOTÓN WHATSAPP */}
            {info?.whatsapp_url && (
              <motion.a
                href={info.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-4 bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/20 px-8 py-4 rounded-2xl transition-all duration-300"
              >
                <svg className="w-6 h-6 fill-[#25D366] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm font-bold text-white uppercase tracking-widest">WhatsApp</span>
              </motion.a>
            )}

            {/* BOTÓN TELEGRAM
            {info?.telegram_url && (
              <motion.a
                href={info.telegram_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-4 bg-[#0088cc]/10 hover:bg-[#0088cc] border border-[#0088cc]/20 px-8 py-4 rounded-2xl transition-all duration-300"
              >
                <svg className="w-6 h-6 fill-[#0088cc] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.168.56-.505 1.259-.832 1.259-.224 0-.448-.112-.672-.336-.224-.224-.56-.56-1.121-1.009-.784-.56-1.233-.896-2.018-1.457-.56-.392-.224-1.065.28-.112.505.953 2.132 4.208 2.412 4.881.056.168.168.336.168.448 0 .112-.056.224-.168.224-.112 0-.28-.056-.448-.168-.224-.112-2.912-1.849-5.488-3.53-.448-.28-.896-.56-.896-.896 0-.336.448-.56 1.008-.84 1.121-.56 5.824-2.522 6.16-2.69.336-.168.56-.168.728-.112.168.056.28.168.336.336z"/>
                </svg>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Telegram</span>
              </motion.a>
            )} */}
          </div>
        </div>
      </section>
    </div>
  );
}