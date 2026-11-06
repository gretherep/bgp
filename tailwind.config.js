/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  future: {
    // hover: solo en dispositivos con puntero real; en táctil no quedan estados "pegados"
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      // Hex literales (no var()) para que funcionen los modificadores de opacidad (bg-primary/20).
      // Mantener sincronizado con :root en src/styles/globals.css.
      // Colores por tema: los valores viven en src/styles/globals.css (:root = claro, .dark = oscuro).
      // brand = relleno rojo fijo (texto blanco encima); primary = rojo de texto, bordes y tintes (se aclara en oscuro).
      // ink = primer plano neutro (negro en claro, blanco en oscuro): usar ink en vez de black/white para bordes y textos.
      colors: {
        brand: "#960000",
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        secondary: "rgb(var(--c-secondary) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        background: "rgb(var(--c-background) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        whatsapp: "#25D366",
        offer: "#dc2626",
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out forwards',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
