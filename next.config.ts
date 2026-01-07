/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [640, 1200], // Solo dos tamaños grandes
    imageSizes: [16, 32, 128, 256], // Tamaños pequeños para miniaturas
    formats: ['image/webp'], // Solo genera WebP, no intentes otros formatos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fruzelhtekormrxrdohf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Añade esto para evitar errores de hidratación y asegurar consistencia en producción
  reactStrictMode: true,
};

export default nextConfig;