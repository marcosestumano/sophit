'use client'

import { useCallback, useEffect, useState } from 'react'
import { isIOS, isStandalone } from '@/lib/pwa'

/**
 * Estado dos avisos neste aparelho:
 * - 'unsupported': navegador sem suporte (ou ambiente de dev, sem service worker)
 * - 'ios-install': iPhone fora do app instalado — o iOS só libera push no app da tela inicial
 * - 'denied': o aluno bloqueou nas configurações do navegador
 * - 'off' | 'on'
 */
export type PushState = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

function base64UrlParaUint8(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

async function registro() {
  if (!('serviceWorker' in navigator)) return null
  const atual = await navigator.serviceWorker.getRegistration('/')
  if (atual) return atual
  // Primeira abertura: o registro acontece no "load"; espera até 4s por ele
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>(r => setTimeout(() => r(null), 4000)),
  ])
}

export function usePush() {
  const [state, setState] = useState<PushState>('loading')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const atualizar = useCallback(async () => {
    const suporta = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!suporta) { setState(isIOS() && !isStandalone() ? 'ios-install' : 'unsupported'); return }
    if (Notification.permission === 'denied') { setState('denied'); return }
    const reg = await registro()
    if (!reg) { setErro('Service worker não registrado nesta página. Recarregue o app.'); setState('unsupported'); return }
    const sub = await reg.pushManager.getSubscription()
    setState(sub ? 'on' : 'off')
  }, [])

  useEffect(() => { atualizar() }, [atualizar])

  async function ativar() {
    const chave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    setErro(null)
    if (!chave) { setErro('Chave pública de push ausente no build (NEXT_PUBLIC_VAPID_PUBLIC_KEY). Faça um redeploy.'); return false }
    setOcupado(true)
    try {
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') { setErro(`Permissão de notificação: ${permissao}`); await atualizar(); return false }
      const reg = await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlParaUint8(chave) })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub),
      })
      if (!res.ok) { await sub.unsubscribe(); throw new Error(`Servidor respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`) }
      setState('on')
      return true
    } catch (err) {
      console.error('[push] não foi possível ativar:', err)
      setErro(err instanceof Error ? `${err.name}: ${err.message}` : String(err))
      await atualizar()
      return false
    } finally {
      setOcupado(false)
    }
  }

  async function desativar() {
    setOcupado(true)
    try { await desinscreverPush() } finally { setOcupado(false); await atualizar() }
  }

  return { state, ocupado, erro, ativar, desativar }
}

/** Remove a inscrição deste aparelho (no navegador e no servidor). Chamar também ao sair da conta. */
export async function desinscreverPush() {
  try {
    const reg = await registro()
    const sub = await reg?.pushManager.getSubscription()
    if (!sub) return
    await fetch('/api/push/subscribe', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {})
    await sub.unsubscribe()
  } catch (err) {
    console.error('[push] falha ao desinscrever:', err)
  }
}

/** Painel admin: avisa o aluno. Nunca trava o fluxo de salvar — se falhar, só registra no console. */
export function notificarTreino(body: { userId: string; tipo: 'novo' | 'editado' | 'plano'; titulo?: string; quantidade?: number; treinoId?: string }) {
  fetch('/api/push/treino', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => r.json()).then(r => { if (r?.motivo) console.info('[push]', r.motivo) })
    .catch(err => console.error('[push] falha ao notificar:', err))
}
