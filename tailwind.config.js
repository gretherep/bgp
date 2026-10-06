/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
      colors: {
        primary: "#F9C3A4",
        secondary: "#DCDAD9",
        accent: "#95999E",
        background: "#161616",
        surface: "#1d1d1d",
        "surface-2": "#252525",
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
