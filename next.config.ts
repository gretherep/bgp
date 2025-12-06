/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    // Usamos remotePatterns para ser más flexibles y seguros.
    remotePatterns: [
      {
        protocol: 'https', // Protocolo seguro
        hostname: 'fruzelhtekormrxrdohf.supabase.co', // <--- ¡AQUÍ ESTÁ LA SOLUCIÓN!
        port: '', // Dejar vacío
        pathname: '/storage/v1/object/public/**', // Permitir cualquier ruta después de /public/
      },
    ],
  },
};

export default nextConfig;
