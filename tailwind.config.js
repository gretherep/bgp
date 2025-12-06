/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // RUTA 1: Para archivos dentro de src/app/
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', 
    // RUTA 2: Para archivos dentro de src/components/
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // RUTA 3: Por si acaso usas pages dentro de src/
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}