/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fruzelhtekormrxrdohf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Añade esto para evitar errores de hidratación y asegurar consistencia en producción
  reactStrictMode: true,
};

export default nextConfig;