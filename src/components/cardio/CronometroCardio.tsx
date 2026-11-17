'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pause, Play, Square, Trash2, Timer } from 'lucide-react'
import { Sheet } from '@/components/app/Sheet'
import { ProgressBar, CORES } from '@/components/app/AppShell'
import { TIPOS_CARDIO } from './RegistroCardioSheet'
import { alertar, gravarLocal, lerLocal, mmss, prepararAudio } from '@/lib/alerta'
import type { CardioPrescricao } from '@/types'
import { cn } from '@/lib/utils'

/*
 * Cronômetro de cardio.
 * Guarda só o horário de início + o tempo já acumulado (pausas), no localStorage.
 * Assim o tempo continua contando com a tela bloqueada, em outra aba ou após recarregar.
 */

const CHAVE = 'sophit:cardio-cronometro'

export interface Cronometro {
  tipo: string
  prescricao_id: string | null
  meta_min: number | null
  inicio: number | null     // timestamp de quando (re)começou; null = pausado
  acumuladoMs: number       // tempo de trechos anteriores às pausas
  avisouMeta: boolean
}

export function useCronometroCardio() {
  const [c, setC] = useState<Cronometro | null>(null)
  const [, tick] = useState(0)

  useEffect(() => { setC(lerLocal<Cronometro>(CHAVE)) }, [])

  const salvar = useCallback((n: Cronometro | null) => { setC(n); gravarLocal(CHAVE, n) }, [])

  const decorridoMs = c ? c.acumuladoMs + (c.inicio ? Date.now() - c.inicio : 0) : 0
  const rodando = !!c?.inicio

  useEffect(() => {
    if (!c?.inicio) return
    const id = setInterval(() => tick(t => t + 1), 500)
    return () => clearInterval(id)
  }, [c?.inicio])

  // Avisa (vibração + bipe) quando bate a meta prescrita
  useEffect(() => {
    if (!c || !c.inicio || !c.meta_min || c.avisouMeta) return
    if (decorridoMs >= c.meta_min * 60000) { alertar(); salvar({ ...c, avisouMeta: true }) }
  })

  return {
    crono: c,
    decorridoMs,
    rodando,
    iniciar: (d: { tipo: string; prescricao_id: string | null; meta_min: number | null }) => {
      prepararAudio()
      salvar({ ...d, inicio: Date.now(), acumuladoMs: 0, avisouMeta: false })
    },
    pausar: () => { if (c?.inicio) salvar({ ...c, acumuladoMs: decorridoMs, inicio: null }) },
    retomar: () => { if (c && !c.inicio) { prepararAudio(); salvar({ ...c, inicio: Date.now() }) } },
    limpar: () => salvar(null),
  }
}

/** Minutos para o registro: arredonda, mínimo 1. */
export const minutosDe = (ms: number) => Math.max(1, Math.round(ms / 60000))

export function CronometroCard({ crono, decorridoMs, rodando, onPausar, onRetomar, onFinalizar, onDescartar }: {
  crono: Cronometro; decorridoMs: number; rodando: boolean
  onPausar: () => void; onRetomar: () => void; onFinalizar: () => void; onDescartar: () => void
}) {
  const seg = Math.floor(decorridoMs / 1000)
  const metaSeg = crono.meta_min ? crono.meta_min * 60 : null
  const btn = 'press h-12 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors duration-150'

  return (
    <section aria-label="Cronômetro de cardio" className="mt-4 rounded-3xl p-5 bg-[#2c2325] text-[#f8f3f2] dark:bg-[#f8f3f2] dark:text-[#2c2325]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium opacity-70 flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', rodando ? 'bg-[#7fa6e0] animate-pulse motion-reduce:animate-none' : 'bg-current opacity-50')} />
          {rodando ? 'Cardio em andamento' : 'Pausado'} · {crono.tipo}
        </p>
        <button onClick={onDescartar} className="h-11 w-11 -mr-2 -mt-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100" aria-label="Descartar cronômetro">
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <p role="timer" className="text-[64px] leading-none tracking-[-0.04em] tabular-nums mt-2">{mmss(seg)}</p>

      {metaSeg && (
        <div className="mt-4">
          <div className="flex justify-between mb-1.5 text-xs font-medium opacity-80">
            <span>Meta {crono.meta_min} min</span>
            <span>{seg >= metaSeg ? 'Meta batida!' : `faltam ${mmss(metaSeg - seg)}`}</span>
          </div>
          <ProgressBar value={(seg / metaSeg) * 100} color="#7fa6e0" track="rgba(127,166,224,0.2)" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-5">
        {rodando ? (
          <button onClick={onPausar} className={cn(btn, 'bg-white/10 hover:bg-white/15 dark:bg-black/10 dark:hover:bg-black/15')}>
            <Pause className="h-5 w-5" strokeWidth={1.75} /> Pausar
          </button>
        ) : (
          <button onClick={onRetomar} className={cn(btn, 'bg-white/10 hover:bg-white/15 dark:bg-black/10 dark:hover:bg-black/15')}>
            <Play className="h-5 w-5" strokeWidth={1.75} /> Retomar
          </button>
        )}
        <button onClick={onFinalizar} className="btn-primary h-12">
          <Square className="h-4 w-4 fill-current" /> Finalizar
        </button>
      </div>
    </section>
  )
}

export function IniciarCardioSheet({ open, onClose, prescricoes, onStart }: {
  open: boolean; onClose: () => void; prescricoes: CardioPrescricao[]
  onStart: (d: { tipo: string; prescricao_id: string | null; meta_min: number | null }) => void
}) {
  const [tipo, setTipo] = useState('')
  const [prescId, setPrescId] = useState<string | null>(null)
  const [meta, setMeta] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const p = prescricoes[0]
    setTipo(p?.tipo ?? ''); setPrescId(p?.id ?? null); setMeta(p?.duracao_min ?? null)
  }, [open, prescricoes])

  const chip = (ativo: boolean) => cn('press rounded-full border px-4 min-h-[44px] transition-colors duration-150',
    ativo ? 'bg-foreground border-foreground text-background' : 'border-border text-foreground hover:bg-muted')

  return (
    <Sheet open={open} onClose={onClose} title="Iniciar cardio"
      footer={
        <button disabled={!tipo.trim()} onClick={() => onStart({ tipo: tipo.trim(), prescricao_id: prescId, meta_min: meta })} className="btn-primary w-full h-12">
          <Timer className="h-5 w-5" strokeWidth={1.75} /> Começar cronômetro
        </button>
      }>
      <div className="space-y-4">
        {prescricoes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Prescritos para você</p>
            <div className="flex flex-wrap gap-2">
              {prescricoes.map(p => (
                <button key={p.id} type="button" className={chip(prescId === p.id)}
                  onClick={() => { setPrescId(p.id); setTipo(p.tipo); setMeta(p.duracao_min ?? null) }}>
                  {p.tipo}{p.duracao_min ? ` · ${p.duracao_min}min` : ''}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Tipo</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_CARDIO.map(t => (
              <button key={t} type="button" className={chip(tipo === t && !prescId)}
                onClick={() => { setTipo(t); setPrescId(null); setMeta(null) }}>{t}</button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-foreground">Meta (min, opcional)</span>
          <input className="input-base" inputMode="numeric" value={meta ?? ''} placeholder="Sem meta"
            onChange={e => { const v = e.target.value.replace(/\D/g, ''); setMeta(v ? Number(v) : null) }} />
        </label>
        <p className="text-sm text-muted-foreground">O tempo continua contando mesmo com a tela bloqueada. Ao finalizar, a duração já entra no registro.</p>
      </div>
    </Sheet>
  )
}
