"use client";

import { useEffect, useState } from "react";
import { PricingCategory } from "@/app/models/pricingCategory";

export default function AboutPage() {
  const [info, setInfo] = useState<any>(null);
  const [pricing, setPricing] = useState<PricingCategory[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const infoRes = await fetch("/api/descripcion");
      const infoData = await infoRes.json();
      setInfo(infoData);

      const pricingRes = await fetch("/api/pricing-categories");
      const pricingData = await pricingRes.json();
      setPricing(pricingData);
    };

    loadData();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white">

      {/* HERO */}
      <section className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          {info?.image_url && (
            <img
              src={info.image_url}
              alt="Logo"
              className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-white/40"
            />
          )}

          <h1 className="text-4xl font-extrabold">
            {info?.title ?? "Mi Negocio"}
          </h1>
        </div>
      </section>

      {/* DESCRIPCIÓN */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-gray-300">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">
          Sobre Nosotros
        </h2>

        <p className="whitespace-pre-line">
          {info?.description}
        </p>
      </section>

      {/* 🔥 PRECIOS POR CATEGORÍA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-amber-400">
          Precios por Categoría
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricing
            .filter(p => p.is_active)
            .sort((a, b) => a.display_order - b.display_order)
            .map(item => (
              <div
                key={item.id}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition"
              >
                <h3 className="text-xl font-bold mb-2">
                  {item.category}
                </h3>

                <p className="text-3xl font-extrabold text-amber-400 mb-4">
                  {item.currency} {item.price}
                </p>

                {item.description && (
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* CONTACTO */}
      <section className="text-center py-12">
        <div className="flex justify-center gap-6">
          {info?.whatsapp_url && (
            <a
              href={info.whatsapp_url}
              target="_blank"
              className="bg-green-500 px-6 py-3 rounded-xl font-semibold"
            >
              WhatsApp
            </a>
          )}

          {info?.telegram_url && (
            <a
              href={info.telegram_url}
              target="_blank"
              className="bg-blue-500 px-6 py-3 rounded-xl font-semibold"
            >
              Telegram
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
