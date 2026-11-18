import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Sophit — Treino, dieta e cardio',
    short_name: 'Sophit',
    description: 'Seus treinos, sua dieta e seu cardio prescritos pelo seu profissional, em um só app.',
    lang: 'pt-BR',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f3f2',
    theme_color: '#f8f3f2',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Treinos', url: '/dashboard/treinos', icons: [{ src: '/icons/icon-192.png?v=2', sizes: '192x192' }] },
      { name: 'Dieta', url: '/dashboard/dieta', icons: [{ src: '/icons/icon-192.png?v=2', sizes: '192x192' }] },
      { name: 'Cardio', url: '/dashboard/cardio', icons: [{ src: '/icons/icon-192.png?v=2', sizes: '192x192' }] },
    ],
  }
}
