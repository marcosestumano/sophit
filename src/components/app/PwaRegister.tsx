'use client'

import { useEffect } from 'react'
import '@/lib/pwa' // começa a escutar o "beforeinstallprompt" o quanto antes

/** Registra o service worker. Só em produção: no `npm run dev` o cache atrapalharia o hot reload. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
      console.error('[pwa] falha ao registrar o service worker:', err)
    })
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])
  return null
}
