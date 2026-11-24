'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { IconChip, CORES } from '@/components/app/AppShell'
import { usePush } from '@/lib/push'

const CHAVE = 'sophit-convite-avisos'
const PAUSA_MS = 30 * 24 * 60 * 60 * 1000 // "Agora não" esconde por 30 dias

/** Convite na Home para ligar os avisos de treino. Só aparece quando dá para ativar e ainda não está ativo. */
export function ConviteAvisos() {
  const push = usePush()
  const [dispensado, setDispensado] = useState(true) // começa escondido até ler o localStorage (evita piscar)

  useEffect(() => {
    try {
      const ate = Number(localStorage.getItem(CHAVE) || 0)
      setDispensado(Date.now() < ate)
    } catch { setDispensado(false) }
  }, [])

  function agoraNao() {
    setDispensado(true)
    try { localStorage.setItem(CHAVE, String(Date.now() + PAUSA_MS)) } catch {}
  }

  if (dispensado || push.state !== 'off') return null

  return (
    <section aria-labelledby="convite-avisos-titulo" className="app-card mt-5 p-4 flex items-start gap-3 enter">
      <IconChip icon={Bell} color="var(--rose-text)" tint={CORES.treinoTint} />
      <div className="flex-1 min-w-0">
        <p id="convite-avisos-titulo" className="font-medium text-foreground">Saiba quando seu treino mudar</p>
        <p className="text-sm text-muted-foreground mt-0.5">Ative os avisos e receba uma notificação quando seu treino for criado ou ajustado.</p>
        {push.erro && <p role="alert" className="text-xs text-destructive mt-1 break-words">{push.erro}</p>}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => push.ativar()} disabled={push.ocupado} className="btn-primary gap-2">
            {push.ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" strokeWidth={1.75} />}
            Ativar avisos
          </button>
          <button onClick={agoraNao} className="btn-ghost">Agora não</button>
        </div>
      </div>
      <button onClick={agoraNao} aria-label="Fechar convite" className="btn-ghost p-1.5 -mt-1 -mr-1">
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </section>
  )
}
