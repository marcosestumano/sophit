'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dumbbell, Play, ChevronDown, Check, History } from 'lucide-react'
import { AppShell, HeroTitle, Chip } from '@/components/app/AppShell'
import { ProgressaoExercicio } from '@/components/dashboard/ProgressaoExercicio'
import { dateKey, letraTreino, parseKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface Treino {
  id: string; titulo: string; descricao: string | null; lista_exercicios: any[]
  data_atribuicao: string; ativo: boolean
}

interface Props {
  userId: string
  treinos: Treino[]
  progressoes: { treino_id: string; data_registro: string }[]
  abrirId: string | null
}

export function TreinosView({ userId, treinos, progressoes, abrirId }: Props) {
  const ativos = treinos.filter(t => t.ativo)
  const inativos = treinos.filter(t => !t.ativo)
  const today = dateKey()

  // Próximo da rotação: o seguinte ao último treinado
  const ultimo = progressoes.find(p => ativos.some(t => t.id === p.treino_id))
  const ultimoIdx = ultimo ? ativos.findIndex(t => t.id === ultimo.treino_id) : -1
  const proximoId = ativos.length ? ativos[(ultimoIdx + 1) % ativos.length].id : null
  const feitosHoje = new Set(progressoes.filter(p => p.data_registro === today).map(p => p.treino_id))

  const ultimaData = (id: string) => progressoes.find(p => p.treino_id === id)?.data_registro

  const [aberto, setAberto] = useState<string | null>(abrirId)
  const [verHistorico, setVerHistorico] = useState(false)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (abrirId) refs.current[abrirId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [abrirId])

  return (
    <AppShell
      hero={
        <>
          <HeroTitle title="Meus treinos" />
          <div className="mt-3"><Chip><Dumbbell className="h-4 w-4" /> {ativos.length} treino{ativos.length !== 1 ? 's' : ''}</Chip></div>
        </>
      }
    >
      {ativos.length === 0 && (
        <div className="app-card p-10 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhum treino atribuído</p>
          <p className="text-sm text-muted-foreground mt-1">Aguarde seu profissional criar um treino para você.</p>
        </div>
      )}

      <div className="space-y-3">
        {ativos.map((t, i) => (
          <div key={t.id} ref={el => { refs.current[t.id] = el }} className="scroll-mt-4">
            <TreinoItem
              treino={t} letra={letraTreino(i)} userId={userId}
              destaque={t.id === proximoId && !feitosHoje.has(t.id)}
              feitoHoje={feitosHoje.has(t.id)}
              ultima={ultimaData(t.id)}
              aberto={aberto === t.id}
              onToggle={() => setAberto(aberto === t.id ? null : t.id)}
            />
          </div>
        ))}
      </div>

      {inativos.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setVerHistorico(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            <History className="h-4 w-4" /> Treinos anteriores ({inativos.length})
            <ChevronDown className={cn('h-4 w-4 transition-transform', verHistorico && 'rotate-180')} />
          </button>
          {verHistorico && (
            <div className="space-y-3 opacity-80">
              {inativos.map(t => (
                <TreinoItem key={t.id} treino={t} letra="•" userId={userId} destaque={false} feitoHoje={false}
                  ultima={ultimaData(t.id)} aberto={aberto === t.id} onToggle={() => setAberto(aberto === t.id ? null : t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}

function TreinoItem({ treino, letra, userId, destaque, feitoHoje, ultima, aberto, onToggle }: {
  treino: Treino; letra: string; userId: string; destaque: boolean; feitoHoje: boolean
  ultima?: string; aberto: boolean; onToggle: () => void
}) {
  const ex = treino.lista_exercicios ?? []
  return (
    <div className={cn('app-card overflow-hidden', destaque && 'border-2 border-brand-400')}>
      <button onClick={onToggle} className="w-full text-left p-4 flex items-start gap-3">
        <span className={cn('h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0',
          destaque ? 'text-white' : 'bg-muted text-foreground')}
          style={destaque ? { background: 'linear-gradient(150deg,#f294b5,#d45f88)' } : undefined}>
          {feitoHoje ? <Check className="h-6 w-6 text-emerald-500" /> : letra}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            {destaque && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">Próximo</span>}
            {feitoHoje && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Feito hoje</span>}
            <span className="text-xs text-muted-foreground">{ex.length} exercício{ex.length !== 1 ? 's' : ''}</span>
          </span>
          <span className="block text-lg font-bold text-foreground uppercase truncate mt-0.5">{treino.titulo}</span>
          <span className="block text-xs text-muted-foreground">
            {ultima ? `Último registro: ${format(parseKey(ultima), "dd 'de' MMM", { locale: ptBR })}` : 'Ainda não registrado'}
          </span>
        </span>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground mt-3 transition-transform', aberto && 'rotate-180')} />
      </button>

      {destaque && !aberto && (
        <div className="px-4 pb-4">
          <button onClick={onToggle} className="w-full btn-primary py-3 rounded-2xl text-base">
            <Play className="h-4 w-4 fill-current" /> Iniciar treino
          </button>
        </div>
      )}

      {aberto && (
        <div className="border-t border-border p-3 space-y-3 animate-slide-up">
          {treino.descricao && <p className="text-sm text-muted-foreground px-1">{treino.descricao}</p>}
          <p className="text-xs text-muted-foreground px-1">Toque em cada exercício para registrar a carga.</p>
          {ex.map((e: any, i: number) => (
            <ProgressaoExercicio key={i} exercicio={e} treinoId={treino.id} userId={userId} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
