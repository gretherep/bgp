"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShootingStar {
  id: number;
  top: string;
  left: string;
  duration: number;
  delay: number;
  scale: number;
}

export default function NightSky() {
  const [mounted, setMounted] = useState(false);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  /* =========================
     MONTAJE SEGURO EN CLIENTE
  ========================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================
     ESTRELLAS ESTÁTICAS (MÁS TUPIDAS)
  ========================== */
  const staticStars = useMemo(() => {
    if (!mounted) return [];

    const smallStars = Array.from({ length: 70 }).map((_, i) => ({
      id: `s-${i}`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 1.2 + 0.6,
      opacity: 0.15 + Math.random() * 0.25,
      duration: 2 + Math.random() * 3,
    }));

    const mediumStars = Array.from({ length: 35 }).map((_, i) => ({
      id: `m-${i}`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: 0.3 + Math.random() * 0.4,
      duration: 3 + Math.random() * 4,
    }));

    return [...smallStars, ...mediumStars];
  }, [mounted]);

  /* =========================
     ESTRELLAS FUGACES
  ========================== */
  useEffect(() => {
    if (!mounted) return;

    let toggle = false;

    const addShootingStar = () => {
      const count = toggle ? 2 : 1;
      toggle = !toggle;

      const newStars: ShootingStar[] = Array.from({ length: count }).map(() => ({
        id: Math.random() + Date.now(),
        top: `${Math.random() * 30}%`,
        left: `${Math.random() * 40}%`,
        duration: 1.6 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
        scale: 0.6 + Math.random() * 0.6,
      }));

      setShootingStars((prev) => [...prev, ...newStars]);

      newStars.forEach((star) => {
        setTimeout(() => {
          setShootingStars((prev) =>
            prev.filter((s) => s.id !== star.id)
          );
        }, 3500);
      });
    };

    const interval = setInterval(addShootingStar, 5200);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" />
    );
  }

  /* =========================
     CONFIGURACIÓN DE DIRECCIÓN
  ========================== */
  const ANGLE = -35;
  const RAD = (ANGLE * Math.PI) / 180;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 🌌 ESTRELLAS ESTÁTICAS */}
      {staticStars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
          animate={{
            opacity: [
              star.opacity * 0.6,
              star.opacity,
              star.opacity * 0.6,
            ],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 🌠 ESTRELLAS FUGACES */}
      <AnimatePresence>
        {shootingStars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ x: 0, y: 0, opacity: 0, rotate: ANGLE }}
            animate={{
              x: Math.cos(RAD) * 1200,
              y: Math.sin(RAD) * 800,
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              ease: "easeOut",
            }}
            className="absolute z-10"
            style={{
              top: star.top,
              left: star.left,
              scale: star.scale,
            }}
          >
            {/* Núcleo */}
            <div className="w-[3px] h-[3px] bg-white rounded-full shadow-[0_0_15px_3px_rgba(255,255,255,0.8)]" />

            {/* Estela */}
            <div
              className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] rounded-full"
              style={{
                width: "200px",
                background:
                  "linear-gradient(to right, white, rgba(255,255,255,0.4), transparent)",
                boxShadow: "0 0 8px rgba(255,255,255,0.25)",
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
    </div>
  );
}
