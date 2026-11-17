'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Minus, Plus, Timer, X, Check } from 'lucide-react'
import { Sheet } from '@/components/app/Sheet'
import { alertar, gravarLocal, lerLocal, mmss, prepararAudio } from '@/lib/alerta'
import { cn } from '@/lib/utils'

/*
 * Timer de descanso entre séries.
 * - Baseado em horário de término (endsAt), então continua certo com a tela
 *   bloqueada, trocando de aba ou recarregando a página (fica no localStorage).
 * - A barra flutua acima da navegação e acompanha o aluno em qualquer tela.
 */

const CHAVE = 'sophit:descanso'
const CHAVE_PADRAO = 'sophit:descanso-padrao'
export const PRESETS_DESCANSO = [30, 60, 90, 120, 180]

interface Estado {
  rotulo: string
  total: number          // segundos
  endsAt: number | null  // rodando
  restante: number | null // pausado (segundos)
}

interface Ctx {
  /** Abre o painel para escolher o tempo antes de iniciar. */
  abrir: (rotulo?: string) => void
  iniciar: (segundos: number, rotulo?: string) => void
  ativo: boolean
}

const DescansoCtx = createContext<Ctx | null>(null)

const SEM_PROVIDER: Ctx = { abrir: () => {}, iniciar: () => {}, ativo: false }

export function useDescanso() {
  return useContext(DescansoCtx) ?? SEM_PROVIDER
}

export function DescansoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [fim, setFim] = useState(false)       // mostra "Descanso concluído" por alguns segundos
  const [sheet, setSheet] = useState<{ rotulo: string } | null>(null)
  const [, tick] = useState(0)
  const avisou = useRef(false)

  // Restaura um descanso em andamento
  useEffect(() => {
    const salvo = lerLocal<Estado>(CHAVE)
    if (!salvo) return
    if (salvo.endsAt && salvo.endsAt <= Date.now()) { gravarLocal(CHAVE, null); return }
    setEstado(salvo)
  }, [])

  const salvar = useCallback((e: Estado | null) => { setEstado(e); gravarLocal(CHAVE, e) }, [])

  const restante = estado
    ? estado.endsAt ? Math.max(0, (estado.endsAt - Date.now()) / 1000) : (estado.restante ?? 0)
    : 0

  // Relógio + detecção de fim
  useEffect(() => {
    if (!estado?.endsAt) return
    avisou.current = false
    const id = setInterval(() => {
      tick(t => t + 1)
      if (estado.endsAt! <= Date.now() && !avisou.current) {
        avisou.current = true
        alertar()
        salvar(null)
        setFim(true)
      }
    }, 250)
    return () => clearInterval(id)
  }, [estado?.endsAt, salvar])

  useEffect(() => {
    if (!fim) return
    const id = setTimeout(() => setFim(false), 4000)
    return () => clearTimeout(id)
  }, [fim])

  const iniciar = useCallback((segundos: number, rotulo = 'Descanso') => {
    prepararAudio()
    gravarLocal(CHAVE_PADRAO, segundos)
    setFim(false)
    salvar({ rotulo, total: segundos, endsAt: Date.now() + segundos * 1000, restante: null })
  }, [salvar])

  const abrir = useCallback((rotulo = 'Descanso') => setSheet({ rotulo }), [])

  function ajustar(delta: number) {
    if (!estado) return
    if (estado.endsAt) {
      const novoFim = Math.max(Date.now() + 1000, estado.endsAt + delta * 1000)
      salvar({ ...estado, endsAt: novoFim, total: Math.max(estado.total + delta, 1) })
    } else {
      salvar({ ...estado, restante: Math.max(1, (estado.restante ?? 0) + delta), total: Math.max(estado.total + delta, 1) })
    }
  }

  function pausarRetomar() {
    if (!estado) return
    if (estado.endsAt) salvar({ ...estado, endsAt: null, restante: restante })
    else { prepararAudio(); salvar({ ...estado, endsAt: Date.now() + (estado.restante ?? 0) * 1000, restante: null }) }
  }

  const pct = estado ? (1 - restante / Math.max(estado.total, 1)) * 100 : 100

  return (
    <DescansoCtx.Provider value={{ abrir, iniciar, ativo: !!estado }}>
      {children}

      {(estado || fim) && (
        <div
          role="timer" aria-live="off"
          className="fixed inset-x-3 z-[45] bottom-[calc(env(safe-area-inset-bottom)+92px)] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[380px]"
        >
          <div className="rounded-3xl bg-card border border-border shadow-[0_8px_30px_rgba(44,35,37,0.18)] overflow-hidden">
            <div className="h-1 bg-foreground/10">
              <div className="h-full bg-primary transition-[width] duration-300 ease-linear" style={{ width: `${fim ? 100 : pct}%` }} />
            </div>
            {fim ? (
              <div className="flex items-center gap-3 px-4 py-3" aria-live="assertive">
                <span className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-5 w-5" strokeWidth={2} /></span>
                <p className="flex-1 text-lg text-foreground">Descanso concluído. Bora pra próxima série!</p>
                <button onClick={() => setFim(false)} className="h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted" aria-label="Fechar"><X className="h-5 w-5" strokeWidth={1.75} /></button>
              </div>
            ) : estado && (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button onClick={pausarRetomar} className="press min-w-0 flex-1 text-left px-1"
                  aria-label={estado.endsAt ? 'Pausar descanso' : 'Retomar descanso'}>
                  <span className="block text-xs font-medium text-muted-foreground truncate">
                    {estado.endsAt ? estado.rotulo : 'Pausado · toque para retomar'}
                  </span>
                  <span className={cn('block text-[32px] leading-none tracking-[-0.03em] tabular-nums', estado.endsAt ? 'text-foreground' : 'text-muted-foreground')}>
                    {mmss(Math.ceil(restante))}
                  </span>
                </button>
                <button onClick={() => ajustar(-15)} className="press h-11 px-3 rounded-xl border border-border text-sm font-medium hover:bg-muted" aria-label="Menos 15 segundos">−15</button>
                <button onClick={() => ajustar(15)} className="press h-11 px-3 rounded-xl border border-border text-sm font-medium hover:bg-muted" aria-label="Mais 15 segundos">+15</button>
                <button onClick={() => salvar(null)} className="press h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted" aria-label="Pular descanso">
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <DescansoSheet
        open={!!sheet} rotulo={sheet?.rotulo ?? ''}
        onClose={() => setSheet(null)}
        onStart={s => { iniciar(s, sheet?.rotulo); setSheet(null) }}
      />
    </DescansoCtx.Provider>
  )
}

function DescansoSheet({ open, rotulo, onClose, onStart }: {
  open: boolean; rotulo: string; onClose: () => void; onStart: (seg: number) => void
}) {
  const [seg, setSeg] = useState(60)
  useEffect(() => { if (open) setSeg(lerLocal<number>(CHAVE_PADRAO) ?? 60) }, [open])

  return (
    <Sheet open={open} onClose={onClose} title="Descanso"
      footer={<button onClick={() => onStart(seg)} className="btn-primary w-full h-12"><Timer className="h-5 w-5" strokeWidth={1.75} /> Iniciar descanso</button>}>
      {rotulo && rotulo !== 'Descanso' && <p className="text-muted-foreground text-center -mt-1 mb-4">{rotulo}</p>}
      <div className="grid grid-cols-5 gap-2">
        {PRESETS_DESCANSO.map(p => (
          <button key={p} onClick={() => setSeg(p)} aria-pressed={seg === p}
            className={cn('press h-11 rounded-xl border text-sm font-medium transition-colors duration-150',
              seg === p ? 'bg-foreground border-foreground text-background' : 'border-border text-foreground hover:bg-muted')}>
            {p < 60 ? `${p}s` : mmss(p)}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-6 mb-2">
        <button onClick={() => setSeg(s => Math.max(15, s - 15))} className="press h-12 w-12 rounded-full border border-border flex items-center justify-center hover:bg-muted" aria-label="Menos 15 segundos">
          <Minus className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <span className="min-w-[140px] text-center text-[44px] leading-none tracking-[-0.04em] tabular-nums text-foreground">{mmss(seg)}</span>
        <button onClick={() => setSeg(s => Math.min(600, s + 15))} className="press h-12 w-12 rounded-full border border-border flex items-center justify-center hover:bg-muted" aria-label="Mais 15 segundos">
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
      <p className="text-center text-sm text-muted-foreground">Ajuste de 15 em 15 segundos. O último tempo usado fica salvo.</p>
    </Sheet>
  )
}
