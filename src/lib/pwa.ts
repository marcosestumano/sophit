'use client'

import { useEffect, useState } from 'react'

/** Evento do Chrome/Edge/Android que permite abrir o "Instalar app" pelo nosso botão. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    listeners.forEach(l => l())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach(l => l())
  })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Estado da instalação: 'installed' | 'prompt' (botão nativo disponível) | 'ios' (instruções) | 'unavailable' */
export function useInstall() {
  const [state, setState] = useState<'installed' | 'prompt' | 'ios' | 'unavailable'>('unavailable')

  useEffect(() => {
    const update = () => setState(isStandalone() ? 'installed' : deferred ? 'prompt' : isIOS() ? 'ios' : 'unavailable')
    update()
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])

  async function install() {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    listeners.forEach(l => l())
    return outcome === 'accepted'
  }

  return { state, install }
}

/** Apaga as páginas guardadas offline (chamar ao sair da conta). */
export async function limparCachePwa() {
  if (typeof caches === 'undefined') return
  const keys = await caches.keys()
  await Promise.all(keys.filter(k => k.includes('-pages')).map(k => caches.delete(k)))
}
