"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";

interface ShootingStar {
  id: number;
  top: string;
  left: string;
  duration: number;
  delay: number;
  scale: number;
  opacity: number;
  blur: number;
  tailWidth: string;
  color: string;
}

interface StaticStar {
  id: string;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  blur: number;
  color: string;
  depth: number;
}

export default function ShootingStars() {
  const [mounted, setMounted] = useState(false);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  // Configuración de Paralaje (Mouse)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 25 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Movimiento suave basado en el centro de la pantalla
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Paleta Estelar: Blancos, Azules claros (indigo-ish) y Ambar (color-primary-ish)
  const starColors = ["#ffffff", "#e0f2fe", "#f9c3a4", "#818cf8"];

  /* =========================
      GENERACIÓN DE ESTRELLAS
  ========================== */
  const staticStars = useMemo<StaticStar[]>(() => {
    if (!mounted) return [];
    
    const generateStars = (count: number, minSize: number, maxSize: number, minOpacity: number, maxOpacity: number, blur: number, depth: number) => 
      Array.from({ length: count }).map((_, i) => ({
        id: `star-${depth}-${i}`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * (maxSize - minSize) + minSize,
        opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        duration: 4 + Math.random() * 6,
        blur,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        depth,
      }));

    return [
      ...generateStars(120, 0.4, 0.7, 0.1, 0.25, 1.2, 8),  // Lejanas
      ...generateStars(80, 0.8, 1.5, 0.3, 0.5, 0.4, 18),   // Medias
      ...generateStars(30, 1.5, 2.5, 0.5, 0.8, 0, 35),     // Cercanas
    ];
  }, [mounted]);

  /* =========================
      LÓGICA DE LUCEROS
  ========================== */
  useEffect(() => {
    if (!mounted) return;

    const addShootingStars = () => {
      // Genera entre 1 y 3 luceros por ciclo
      const count = 1 + Math.floor(Math.random() * 3); 
      const newStars: ShootingStar[] = Array.from({ length: count }).map((_, i) => {
        const depthRand = Math.random();
        
        let config = { scale: 0.5, duration: 3.5, opacity: 0.4, blur: 1.5, tailWidth: "120px", color: "#ffffff" };

        if (depthRand > 0.85) { // Cercano y rápido
          config = { scale: 1.2, duration: 1.2, opacity: 0.9, blur: 0, tailWidth: "400px", color: "#f9c3a4" };
        } else if (depthRand > 0.4) { // Medio
          config = { scale: 0.8, duration: 2.2, opacity: 0.6, blur: 0.5, tailWidth: "220px", color: "#e0f2fe" };
        }

        return {
          id: Math.random() + Date.now() + i,
          top: `${Math.random() * 50}%`,
          left: `${Math.random() * 60}%`,
          delay: i * 0.5,
          ...config
        };
      });

      setShootingStars(prev => [...prev, ...newStars]);
      newStars.forEach(s => setTimeout(() => setShootingStars(p => p.filter(x => x.id !== s.id)), 5000));
    };

    const interval = setInterval(addShootingStars, 3500);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  const ANGLE = -35;
  const RAD = (ANGLE * Math.PI) / 180;

  return (
    // "bg-transparent" para que se vea tu fondo original
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-transparent">
      
      {/* 🌌 ESTRELLAS ESTÁTICAS CON MOVIMIENTO DE RATÓN */}
      {staticStars.map((star) => (
        <StarItem key={star.id} star={star} smoothX={smoothX} smoothY={smoothY} />
      ))}

      {/* 🌠 LUCEROS ANIMADOS */}
      <AnimatePresence>
        {shootingStars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ x: 0, y: 0, opacity: 0, rotate: ANGLE }}
            animate={{
              x: Math.cos(RAD) * 1800,
              y: Math.sin(RAD) * 1200,
              opacity: [0, star.opacity, star.opacity, 0],
            }}
            transition={{ duration: star.duration, delay: star.delay, ease: "linear" }}
            className="absolute"
            style={{ 
              top: star.top, 
              left: star.left, 
              scale: star.scale, 
              filter: `blur(${star.blur}px)`,
              zIndex: 10 
            }}
          >
            {/* Cabeza del lucero */}
            <div 
              className="w-[2px] h-[2px] rounded-full" 
              style={{ 
                backgroundColor: star.color,
                boxShadow: `0 0 15px 3px ${star.color}` 
              }} 
            />
            {/* Estela */}
            <div 
              className="absolute top-1/2 left-0 -translate-y-1/2 h-[1px]" 
              style={{ 
                width: star.tailWidth, 
                background: `linear-gradient(to right, ${star.color}cc, ${star.color}33, transparent)` 
              }} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* =========================
    SUB-COMPONENTE OPTIMIZADO
========================== */
function StarItem({ star, smoothX, smoothY }: { star: StaticStar, smoothX: MotionValue<number>, smoothY: MotionValue<number> }) {
  // Aplicamos el paralaje: el movimiento es inversamente proporcional a la profundidad
  const x = useTransform(smoothX, (v: number) => v * star.depth * -1.2);
  const y = useTransform(smoothY, (v: number) => v * star.depth * -1.2);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        top: star.top,
        left: star.left,
        width: star.size,
        height: star.size,
        backgroundColor: star.color,
        opacity: star.opacity,
        filter: `blur(${star.blur}px)`,
        x,
        y,
        // Solo las estrellas más grandes tienen brillo exterior (box-shadow)
        boxShadow: star.size > 1.8 ? `0 0 6px 1px ${star.color}66` : 'none'
      }}
      animate={{
        opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: star.duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}