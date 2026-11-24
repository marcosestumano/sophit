import type { Metadata, Viewport } from 'next'
import './globals.css'
import localFont from 'next/font/local'

import { SplashProvider } from '@/components/SplashProvider'
import { PwaRegister } from '@/components/app/PwaRegister'

// Outfit guardada no projeto: o build não depende de baixar fontes do Google
const outfit = localFont({
  src: [
    { path: './fonts/outfit-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/outfit-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sophit — Saúde & Performance',
  description: 'Plataforma SaaS para profissionais de saúde e fitness',
  applicationName: 'Sophit',
  appleWebApp: { capable: true, title: 'Sophit', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png?v=2', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#f8f3f2',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={outfit.variable} suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme')
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {}
            `,
          }}
        />
        <PwaRegister />
        <SplashProvider>
          {children}
        </SplashProvider>
      </body>
    </html>
  )
}
