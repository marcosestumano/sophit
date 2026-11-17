'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dumbbell, Play, ChevronDown, ChevronRight, Check, Timer } from 'lucide-react'
import { useDescanso } from '@/components/treinos/Descanso'
import { AppScreen, ScreenHeader } from '@/components/app/AppShell'
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

  const descanso = useDescanso()
  const [aberto, setAberto] = useState<string | null>(abrirId)
  const [verHistorico, setVerHistorico] = useState(false)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (abrirId) refs.current[abrirId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [abrirId])

  return (
    <AppScreen>
      <ScreenHeader title="Meus treinos" sub={`${ativos.length} treino${ativos.length !== 1 ? 's' : ''} no plano`} />

      {ativos.length === 0 && (
        <div className="app-card p-8 mt-4 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" strokeWidth={1.5} />
          <p className="font-medium text-foreground">Nenhum treino ainda</p>
          <p className="text-muted-foreground mt-1">Seu profissional monta os treinos e eles aparecem aqui.</p>
        </div>
      )}

      <div className="space-y-3 mt-2">
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
        <div className="mt-6">
          <button onClick={() => setVerHistorico(v => !v)} aria-expanded={verHistorico}
            className="link-rose flex items-center gap-2 min-h-[44px]">
            Treinos anteriores ({inativos.length})
            <ChevronDown className={cn('h-[18px] w-[18px] transition-transform duration-150', verHistorico && 'rotate-180')} strokeWidth={1.75} />
          </button>
          {verHistorico && (
            <div className="space-y-3 mt-2">
              {inativos.map(t => (
                <TreinoItem key={t.id} treino={t} letra="·" userId={userId} destaque={false} feitoHoje={false}
                  ultima={ultimaData(t.id)} aberto={aberto === t.id} onToggle={() => setAberto(aberto === t.id ? null : t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
      {/* folga para a barra flutuante do descanso não cobrir o último exercício */}
      {descanso.ativo && <div className="h-24" aria-hidden="true" />}
    </AppScreen>
  )
}

function TreinoItem({ treino, letra, userId, destaque, feitoHoje, ultima, aberto, onToggle }: {
  treino: Treino; letra: string; userId: string; destaque: boolean; feitoHoje: boolean
  ultima?: string; aberto: boolean; onToggle: () => void
}) {
  const descanso = useDescanso()
  const ex = treino.lista_exercicios ?? []
  const meta = `${ex.length} exercício${ex.length !== 1 ? 's' : ''} · ${ultima ? `último em ${format(parseKey(ultima), "d 'de' MMM", { locale: ptBR })}` : 'ainda não registrado'}`

  if (destaque && !aberto) {
    return (
      <div className="app-card p-5 border-2 border-primary">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl">{letra}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Próximo · {ex.length} exercícios</p>
            <p className="text-[28px] leading-tight tracking-[-0.02em] text-foreground truncate">{treino.titulo}</p>
          </div>
        </div>
        <p className="mt-3 mb-4 text-muted-foreground">
          {ultima ? `Último registro em ${format(parseKey(ultima), "d 'de' MMMM", { locale: ptBR })}.` : 'Primeira vez com este treino.'}
        </p>
        <button onClick={onToggle} className="btn-primary w-full h-12"><Play className="h-4 w-4 fill-current" /> Iniciar treino</button>
      </div>
    )
  }

  return (
    <div className={cn('app-card overflow-hidden', !aberto && 'lift')}>
      <button onClick={onToggle} aria-expanded={aberto} className="w-full text-left p-4 flex items-center gap-4 min-h-[80px]">
        <span className={cn('h-12 w-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0',
          aberto && destaque ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
          {feitoHoje ? <Check className="h-6 w-6 text-dieta" strokeWidth={2} /> : letra}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xl tracking-[-0.01em] text-foreground truncate">{treino.titulo}</span>
          <span className="block text-xs font-medium text-muted-foreground">{feitoHoje ? 'Feito hoje · ' : ''}{meta}</span>
        </span>
        {aberto
          ? <ChevronDown className="h-5 w-5 text-muted-foreground rotate-180" strokeWidth={1.75} />
          : <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />}
      </button>

      {aberto && (
        <div className="border-t border-border p-3 space-y-3">
          {treino.descricao && <p className="text-muted-foreground px-1">{treino.descricao}</p>}
          <div className="flex items-center gap-3 px-1">
            <p className="flex-1 text-sm text-muted-foreground">Toque em cada exercício para registrar a carga.</p>
            <button onClick={() => descanso.abrir(treino.titulo)}
              className="press flex-shrink-0 h-11 px-4 rounded-full border border-border flex items-center gap-2 text-sm font-medium text-foreground hover:bg-muted">
              <Timer className="h-4 w-4" strokeWidth={1.75} /> Descanso
            </button>
          </div>
          {ex.map((e: any, i: number) => (
            <ProgressaoExercicio key={i} exercicio={e} treinoId={treino.id} userId={userId} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
