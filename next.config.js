/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Sem cache de navegação para páginas dinâmicas: ao voltar para uma tela,
    // ela sempre mostra o que acabou de ser salvo no Supabase.
    staleTimes: { dynamic: 0 },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig
