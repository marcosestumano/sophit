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

/** Pede ao servidor um push de teste para este usuário e devolve um texto com o resultado. */
export async function enviarTeste(): Promise<string> {
  try {
    const res = await fetch('/api/push/teste', { method: 'POST' })
    const r = await res.json()
    if (!res.ok) return `Erro ${res.status}: ${r?.error ?? 'desconhecido'}`
    if (r.motivo) return `Não enviado: ${r.motivo}`
    if (r.enviados) return `Enviado para ${r.enviados} de ${r.aparelhos} aparelho(s). Deve chegar em alguns segundos.`
    return `Falhou em ${r.falhas} aparelho(s): ${(r.erros ?? []).join(' | ')}`
  } catch (err) {
    return `Erro de rede: ${err instanceof Error ? err.message : String(err)}`
  }
}

/** Aviso flutuante simples (sem depender de React), some sozinho. */
function aviso(texto: string, erro = false) {
  if (typeof document === 'undefined') return
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.textContent = texto
  el.style.cssText = `position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:min(92vw,480px);
    padding:10px 16px;border-radius:12px;font-size:14px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.18);
    background:${erro ? 'hsl(0 70% 45%)' : 'hsl(var(--foreground))'};color:${erro ? '#fff' : 'hsl(var(--background))'}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 6000)
}

/** Painel admin: avisa o aluno e mostra ao admin se o push saiu. Nunca trava o fluxo de salvar. */
export function notificarTreino(body: { userId: string; tipo: 'novo' | 'editado' | 'plano'; titulo?: string; quantidade?: number; treinoId?: string }) {
  fetch('/api/push/treino', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async res => {
      const r = await res.json().catch(() => ({}))
      if (!res.ok) return aviso(`Push: erro ${res.status} ${r?.error ?? ''}`, true)
      if (r.motivo) return aviso(`Aluno não avisado: ${r.motivo}`, true)
      if (r.enviados) return aviso(`Aluno avisado no celular (${r.enviados} aparelho${r.enviados > 1 ? 's' : ''})`)
      aviso(`Push falhou: ${(r.erros ?? []).join(' | ')}`, true)
    })
    .catch(err => aviso(`Push: erro de rede (${err?.message ?? err})`, true))
}
