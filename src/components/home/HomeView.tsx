'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Flame, Dumbbell, Utensils, HeartPulse, ArrowRight, Play, Check, Scale, ChevronRight, Camera, Trophy, Droplets,
} from 'lucide-react'
import { AppShell, ProgressBar, CORES } from '@/components/app/AppShell'
import { dateKey, weekDays, DIAS_CURTOS, currentStreak, bestStreak, letraTreino, parseKey } from '@/lib/dates'
import { somaMacros, round, ordenarRefeicoes } from '@/lib/dieta'
import type { DietaPlano, DietaRefeicao, CardioPrescricao } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'treino' | 'dieta' | 'cardio'

interface Props {
  nome: string
  treinos: { id: string; titulo: string; lista_exercicios: any[] }[]
  progressoes: { treino_id: string; data_registro: string }[]
  plano: DietaPlano | null
  refeicoes: DietaRefeicao[]
  checks: { refeicao_id: string; data: string }[]
  cardioPrescricoes: CardioPrescricao[]
  cardioRegistros: { id: string; data: string; tipo: string; duracao_min: number | null }[]
  avaliacoes: { peso: number | null; percentual_gordura: number | null; created_at: string }[]
}

export function HomeView(p: Props) {
  const today = new Date()
  const todayKey = dateKey(today)
  const [selected, setSelected] = useState(todayKey)
  const [tab, setTab] = useState<Tab>(p.treinos.length ? 'treino' : p.plano ? 'dieta' : 'cardio')

  const refeicoes = useMemo(() => ordenarRefeicoes(p.refeicoes), [p.refeicoes])

  // ── Dias concluídos por categoria ────────────────────────────
  const dados = useMemo(() => {
    const treinoDays = new Set(p.progressoes.map(x => x.data_registro))
    const cardioDays = new Set(p.cardioRegistros.map(x => x.data))
    const idsRef = new Set(refeicoes.map(r => r.id))
    const checksPorDia = new Map<string, Set<string>>()
    for (const c of p.checks) {
      if (!idsRef.has(c.refeicao_id)) continue
      if (!checksPorDia.has(c.data)) checksPorDia.set(c.data, new Set())
      checksPorDia.get(c.data)!.add(c.refeicao_id)
    }
    const dietaDays = new Set<string>()
    if (refeicoes.length) checksPorDia.forEach((s, d) => { if (s.size >= refeicoes.length) dietaDays.add(d) })
    const anyDays = new Set([...Array.from(treinoDays), ...Array.from(cardioDays), ...Array.from(dietaDays)])
    return { treinoDays, cardioDays, dietaDays, anyDays, checksPorDia }
  }, [p.progressoes, p.cardioRegistros, p.checks, refeicoes])

  const streak = currentStreak(k => dados.anyDays.has(k), today)
  const recorde = Math.max(bestStreak(dados.anyDays), streak)
  const sTreino = currentStreak(k => dados.treinoDays.has(k), today)
  const sDieta = currentStreak(k => dados.dietaDays.has(k), today)
  const sCardio = currentStreak(k => dados.cardioDays.has(k), today)

  const semana = weekDays(today)
  const selDate = parseKey(selected)
  const selLabel = selected === todayKey ? 'Hoje' : format(selDate, "EEE dd", { locale: ptBR })

  return (
    <AppShell
      hero={
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-14 w-14 rounded-full bg-white/25 border-2 border-white/60 flex items-center justify-center text-xl font-bold">
              {p.nome[0]?.toUpperCase()}
            </div>
            <h1 className="flex-1 text-2xl font-bold drop-shadow-sm truncate">Olá, {p.nome}!</h1>
          </div>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-2xl bg-white/20 border border-white/40 backdrop-blur p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                <Flame className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="leading-none"><span className="text-3xl font-bold">{streak}</span> <span className="text-sm">dia{streak !== 1 ? 's' : ''}</span></p>
                <p className="text-[11px] font-bold uppercase tracking-wide mt-1 opacity-90">Sequência atual</p>
                <p className="text-xs opacity-80 flex items-center gap-1"><Trophy className="h-3 w-3" /> Recorde: {recorde} dia{recorde !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2 text-sm min-w-[130px]">
              <StreakRow icon={Utensils} label="Dieta" n={sDieta} />
              <StreakRow icon={Dumbbell} label="Treino" n={sTreino} />
              <StreakRow icon={HeartPulse} label="Cardio" n={sCardio} />
            </div>
          </div>
        </>
      }
    >
      {/* Calendário semanal */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {semana.map((d, i) => {
          const k = dateKey(d)
          const ativo = k === selected
          const hoje = k === todayKey
          const temRef = refeicoes.length > 0
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={cn(
                'rounded-2xl py-2.5 flex flex-col items-center gap-1 border transition-colors',
                ativo ? 'border-transparent text-white' : 'border-border text-foreground',
                hoje && !ativo && 'border-brand-300'
              )}
              style={ativo ? { background: 'linear-gradient(160deg,#f294b5,#e8799f)' } : undefined}
            >
              <span className={cn('text-[11px] font-semibold', !ativo && 'text-muted-foreground')}>{DIAS_CURTOS[i]}</span>
              <span className="text-lg font-bold leading-none">{format(d, 'd')}</span>
              <span className="flex gap-0.5 h-1.5">
                {p.treinos.length > 0 && <Dot color={CORES.treino} on={dados.treinoDays.has(k)} white={ativo} />}
                {temRef && <Dot color={CORES.dieta} on={dados.dietaDays.has(k)} white={ativo} />}
                {p.cardioPrescricoes.length > 0 && <Dot color={CORES.cardio} on={dados.cardioDays.has(k)} white={ativo} />}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card resumo */}
      <ResumoCard tab={tab} setTab={setTab} label={selLabel}>
        {tab === 'treino' && <TreinoResumo {...p} selected={selected} treinoDays={dados.treinoDays} />}
        {tab === 'dieta' && <DietaResumo plano={p.plano} refeicoes={refeicoes} checados={dados.checksPorDia.get(selected)} />}
        {tab === 'cardio' && <CardioResumo prescricoes={p.cardioPrescricoes} registros={p.cardioRegistros} selected={selected} />}
      </ResumoCard>

      {/* Progresso */}
      <div className="flex items-center justify-between mt-7 mb-3">
        <h2 className="text-lg font-bold text-foreground">Progresso</h2>
        <Link href="/dashboard/progresso" className="text-sm font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1">
          Fotos <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <ProgressoCard avaliacoes={p.avaliacoes} />
      <Link href="/dashboard/progresso" className="app-card mt-3 p-4 flex items-center gap-3 active:bg-muted">
        <span className="h-10 w-10 rounded-full flex items-center justify-center bg-brand-100 dark:bg-brand-900/40">
          <Camera className="h-5 w-5 text-brand-600 dark:text-brand-300" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-foreground">Fotos de evolução</span>
          <span className="block text-xs text-muted-foreground">Compare seu antes e depois</span>
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
      {p.plano?.agua_litros ? (
        <div className="app-card mt-3 p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,196,242,0.2)' }}>
            <Droplets className="h-5 w-5" style={{ color: CORES.agua }} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-foreground">Meta de água</span>
            <span className="block text-xs text-muted-foreground">{String(p.plano.agua_litros).replace('.', ',')} litros por dia</span>
          </span>
        </div>
      ) : null}
    </AppShell>
  )
}

function StreakRow({ icon: Icon, label, n }: { icon: any; label: string; n: number }) {
  return (
    <div className={cn('flex items-center gap-2', n === 0 && 'opacity-60')}>
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {n > 0 ? <span className="flex items-center gap-0.5 font-semibold"><Flame className="h-3.5 w-3.5" />{n}</span> : <span>—</span>}
    </div>
  )
}

function Dot({ color, on, white }: { color: string; on: boolean; white: boolean }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: white && !on ? 'rgba(255,255,255,0.6)' : color, opacity: on ? 1 : 0.3 }} />
}

const TAB_STYLE: Record<Tab, { bg: string; titulo: string; icon: any; href: string; link: string }> = {
  treino: { bg: 'linear-gradient(150deg,#b4476e,#8f3858)', titulo: 'Treino', icon: Dumbbell, href: '/dashboard/treinos', link: 'Ver treinos' },
  dieta:  { bg: 'linear-gradient(150deg,#2f7a52,#1f5a3c)', titulo: 'Dieta', icon: Utensils, href: '/dashboard/dieta', link: 'Ver dieta' },
  cardio: { bg: 'linear-gradient(150deg,#7c62c9,#5a46a0)', titulo: 'Cardio', icon: HeartPulse, href: '/dashboard/cardio', link: 'Ver cardio' },
}

function ResumoCard({ tab, setTab, label, children }: { tab: Tab; setTab: (t: Tab) => void; label: string; children: React.ReactNode }) {
  const st = TAB_STYLE[tab]
  const BgIcon = st.icon
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 text-white" style={{ background: st.bg }}>
      <BgIcon className="absolute -right-6 top-4 h-48 w-48 opacity-10" strokeWidth={1.5} />
      <p className="relative text-xs font-bold uppercase tracking-[0.15em] opacity-80">{label} · {st.titulo}</p>
      <div className="relative mt-3">{children}</div>
      <div className="relative mt-5 flex items-center justify-between">
        <Link href={st.href} className="flex items-center gap-1.5 font-bold">
          {st.link} <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-black/20 p-1">
          {(Object.keys(TAB_STYLE) as Tab[]).map(t => {
            const I = TAB_STYLE[t].icon
            return (
              <button key={t} onClick={() => setTab(t)} aria-label={TAB_STYLE[t].titulo}
                className={cn('h-9 w-9 rounded-full flex items-center justify-center transition-colors', t === tab ? 'bg-black/40' : 'opacity-70')}>
                <I className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Vazio({ texto }: { texto: string }) {
  return <p className="text-white/85 py-6">{texto}</p>
}

function TreinoResumo({ treinos, progressoes, selected, treinoDays }: Props & { selected: string; treinoDays: Set<string> }) {
  if (!treinos.length) return <Vazio texto="Nenhum treino prescrito ainda." />

  const feitosNoDia = Array.from(new Set(progressoes.filter(x => x.data_registro === selected).map(x => x.treino_id)))
    .map(id => treinos.find(t => t.id === id)).filter(Boolean) as Props['treinos']

  // Próximo treino: o seguinte ao último treinado (rotação A → B → C...)
  const anteriores = progressoes.filter(x => x.data_registro < selected).sort((a, b) => b.data_registro.localeCompare(a.data_registro))
  const ultimoIdx = anteriores.length ? treinos.findIndex(t => t.id === anteriores[0].treino_id) : -1
  const proxIdx = (ultimoIdx + 1) % treinos.length
  const prox = treinos[proxIdx]

  const semanaKeys = weekDays(parseKey(selected)).map(dateKey)
  const naSemana = semanaKeys.filter(k => treinoDays.has(k)).length

  if (feitosNoDia.length) {
    return (
      <div>
        <div className="flex items-center gap-2 text-white/90 font-semibold"><Check className="h-5 w-5" /> Treino concluído</div>
        <p className="text-3xl font-bold mt-1">{feitosNoDia.map(t => t.titulo).join(' + ')}</p>
        <p className="text-sm opacity-85 mt-3">{naSemana} treino{naSemana !== 1 ? 's' : ''} nesta semana</p>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-xl font-bold">{letraTreino(proxIdx)}</span>
        <div className="min-w-0">
          <p className="text-xs opacity-80">Próximo treino · {prox.lista_exercicios?.length ?? 0} exercícios</p>
          <p className="text-2xl font-bold truncate">{prox.titulo}</p>
        </div>
      </div>
      <Link href={`/dashboard/treinos?t=${prox.id}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white text-brand-700 font-bold py-3 active:scale-[0.98] transition-transform">
        <Play className="h-4 w-4 fill-current" /> Iniciar treino
      </Link>
      <p className="text-sm opacity-85 mt-3">{naSemana} treino{naSemana !== 1 ? 's' : ''} nesta semana</p>
    </div>
  )
}

function DietaResumo({ plano, refeicoes, checados }: { plano: DietaPlano | null; refeicoes: DietaRefeicao[]; checados?: Set<string> }) {
  if (!plano || !refeicoes.length) return <Vazio texto="Nenhuma refeição no seu plano ainda." />
  const total = somaMacros(refeicoes)
  const feitas = refeicoes.filter(r => checados?.has(r.id))
  const cons = somaMacros(feitas)
  const meta = {
    kcal: plano.meta_kcal || total.kcal, proteina: plano.meta_proteina || total.proteina,
    carbo: plano.meta_carbo || total.carbo, gordura: plano.meta_gordura || total.gordura,
  }
  const pct = meta.kcal ? round((cons.kcal / meta.kcal) * 100) : 0
  return (
    <div>
      <p className="flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl font-bold tracking-tight">{round(cons.kcal)}</span>
        <span className="text-xl font-bold">kcal</span>
        <span className="text-xl opacity-75">de {round(meta.kcal)} kcal</span>
      </p>
      <ProgressBar value={pct} color="#ffffff" track="rgba(0,0,0,0.25)" className="mt-3" />
      <p className="text-sm mt-2 opacity-90">
        {feitas.length}/{refeicoes.length} refeições · {meta.kcal - cons.kcal > 0 ? `Faltam ${round(meta.kcal - cons.kcal)} kcal` : 'Meta atingida'} · {pct}%
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Macro label="Proteína" v={cons.proteina} m={meta.proteina} />
        <Macro label="Carbo" v={cons.carbo} m={meta.carbo} />
        <Macro label="Gordura" v={cons.gordura} m={meta.gordura} />
      </div>
    </div>
  )
}

function Macro({ label, v, m }: { label: string; v: number; m: number }) {
  return (
    <div className="rounded-xl bg-black/30 p-3">
      <p className="text-xs opacity-80">{label}</p>
      <p className="font-semibold mt-1">{round(v)}/{round(m)}g</p>
      <ProgressBar value={m ? (v / m) * 100 : 0} color="#a7f3c9" track="rgba(255,255,255,0.15)" className="mt-2 h-1.5" />
    </div>
  )
}

function CardioResumo({ prescricoes, registros, selected }: { prescricoes: CardioPrescricao[]; registros: Props['cardioRegistros']; selected: string }) {
  const semanaKeys = new Set(weekDays(parseKey(selected)).map(dateKey))
  const daSemana = registros.filter(r => semanaKeys.has(r.data))
  const minSemana = daSemana.reduce((s, r) => s + (r.duracao_min ?? 0), 0)
  const metaMin = prescricoes.reduce((s, c) => s + (c.duracao_min ?? 0) * (c.frequencia_semana ?? 1), 0)
  const metaSessoes = prescricoes.reduce((s, c) => s + (c.frequencia_semana ?? 0), 0)
  const doDia = registros.filter(r => r.data === selected)

  if (!prescricoes.length && !daSemana.length) return <Vazio texto="Nenhum cardio prescrito. Você ainda pode registrar os seus." />
  return (
    <div>
      <p className="flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl font-bold tracking-tight">{minSemana}</span>
        <span className="text-xl font-bold">min</span>
        {metaMin > 0 && <span className="text-xl opacity-75">de {metaMin} min na semana</span>}
      </p>
      {metaMin > 0 && <ProgressBar value={(minSemana / metaMin) * 100} color="#ffffff" track="rgba(0,0,0,0.25)" className="mt-3" />}
      <p className="text-sm mt-2 opacity-90">
        {daSemana.length}{metaSessoes ? `/${metaSessoes}` : ''} sessões nesta semana
      </p>
      <div className="mt-4 space-y-2">
        {doDia.length ? doDia.map(r => (
          <div key={r.id} className="rounded-xl bg-black/25 px-3 py-2 flex items-center gap-2 text-sm">
            <Check className="h-4 w-4" /> <span className="flex-1 font-medium">{r.tipo}</span> {r.duracao_min ? `${r.duracao_min} min` : ''}
          </div>
        )) : <p className="text-sm opacity-80">Nenhum cardio registrado neste dia.</p>}
      </div>
    </div>
  )
}

function ProgressoCard({ avaliacoes }: { avaliacoes: Props['avaliacoes'] }) {
  const [ult, ant] = avaliacoes
  if (!ult?.peso) {
    return (
      <div className="app-card p-4 flex items-center gap-3">
        <Scale className="h-7 w-7 text-brand-500" />
        <p className="text-sm text-muted-foreground">Sua primeira avaliação física aparecerá aqui.</p>
      </div>
    )
  }
  const diff = ant?.peso ? Number(ult.peso) - Number(ant.peso) : null
  return (
    <div className="app-card p-4 flex items-center gap-4">
      <Scale className="h-7 w-7 text-brand-500 flex-shrink-0" />
      <div className="flex-1">
        <p><span className="text-3xl font-bold text-foreground">{String(ult.peso).replace('.', ',')}</span> <span className="text-muted-foreground">kg</span></p>
        <p className="text-xs text-muted-foreground">
          Avaliação de {format(new Date(ult.created_at), "dd 'de' MMM", { locale: ptBR })}
          {diff !== null && diff !== 0 && <> · <span className={diff < 0 ? 'text-emerald-500' : 'text-brand-600'}>{diff > 0 ? '+' : ''}{diff.toFixed(1).replace('.', ',')} kg</span></>}
        </p>
      </div>
      {ult.percentual_gordura != null && (
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">{String(ult.percentual_gordura).replace('.', ',')}%</p>
          <p className="text-xs text-muted-foreground">gordura</p>
        </div>
      )}
    </div>
  )
}
