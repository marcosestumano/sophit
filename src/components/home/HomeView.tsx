'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Flame, Dumbbell, Utensils, HeartPulse, ArrowRight, Play, Check, Scale, ChevronRight, Droplets } from 'lucide-react'
import { AppScreen, SectionTitle, ProgressBar, IconChip, CORES } from '@/components/app/AppShell'
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

const n = (v: number) => round(v).toLocaleString('pt-BR')
const dias = (v: number) => `${v} dia${v !== 1 ? 's' : ''}`

export function HomeView(p: Props) {
  const today = new Date()
  const todayKey = dateKey(today)
  const [selected, setSelected] = useState(todayKey)
  const [tab, setTab] = useState<Tab>(p.treinos.length ? 'treino' : p.plano ? 'dieta' : 'cardio')

  const refeicoes = useMemo(() => ordenarRefeicoes(p.refeicoes), [p.refeicoes])

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
  const selLabel = selected === todayKey ? 'Hoje' : format(parseKey(selected), "EEE, dd", { locale: ptBR })

  return (
    <AppScreen>
      <header className="flex items-center gap-3 pt-2">
        <span className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-medium">
          {p.nome[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="enter text-[28px] leading-tight font-normal tracking-[-0.03em] text-foreground truncate">Olá, {p.nome}</h1>
          <p className="enter-2 text-sm text-muted-foreground capitalize">{format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
      </header>

      {/* Sequência */}
      <div className="app-card p-4 mt-5 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <IconChip icon={Flame} color="var(--rose-text)" tint={CORES.treinoTint} size={48} />
          <div className="min-w-0">
            <p className="text-[28px] leading-[1.1] tracking-[-0.03em] text-foreground">{dias(streak)}</p>
            <p className="text-xs font-medium text-muted-foreground">Sequência atual · recorde {recorde}</p>
          </div>
        </div>
        <div className="w-px self-stretch bg-border" />
        <div className="w-[118px] space-y-0.5">
          <StreakRow icon={Utensils} label="Dieta" v={sDieta} />
          <StreakRow icon={Dumbbell} label="Treino" v={sTreino} />
          <StreakRow icon={HeartPulse} label="Cardio" v={sCardio} />
        </div>
      </div>

      {/* Semana */}
      <div className="flex justify-between mt-4">
        {semana.map((d, i) => {
          const k = dateKey(d)
          const ativo = k === selected
          return (
            <button key={k} onClick={() => setSelected(k)} aria-pressed={ativo} aria-label={format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
              className={cn('press w-[42px] h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-colors duration-150',
                ativo ? 'bg-[#2c2325] border-[#2c2325] text-[#f8f3f2] dark:bg-[#f8f3f2] dark:border-[#f8f3f2] dark:text-[#2c2325]' : 'bg-card border-border text-foreground',
                k === todayKey && !ativo && 'border-primary')}>
              <span className={cn('text-xs font-medium', ativo ? 'opacity-70' : 'text-muted-foreground')}>{DIAS_CURTOS[i]}</span>
              <span className="text-lg leading-tight">{format(d, 'd')}</span>
              <span className="flex gap-[3px] mt-0.5 h-1.5">
                {p.treinos.length > 0 && <Dot color={CORES.treino} on={dados.treinoDays.has(k)} />}
                {refeicoes.length > 0 && <Dot color={CORES.dieta} on={dados.dietaDays.has(k)} />}
                {p.cardioPrescricoes.length > 0 && <Dot color={CORES.cardio} on={dados.cardioDays.has(k)} />}
              </span>
            </button>
          )
        })}
      </div>

      {/* Resumo do dia — o único painel escuro da tela */}
      <section aria-label={`Resumo de ${selLabel}`} className="app-panel mt-4 p-5">
        <p className="text-xs font-medium opacity-70">{selLabel} · {TABS[tab].titulo.toLowerCase()}</p>
        <div className="mt-2">
          {tab === 'treino' && <TreinoResumo {...p} selected={selected} treinoDays={dados.treinoDays} />}
          {tab === 'dieta' && <DietaResumo plano={p.plano} refeicoes={refeicoes} checados={dados.checksPorDia.get(selected)} />}
          {tab === 'cardio' && <CardioResumo prescricoes={p.cardioPrescricoes} registros={p.cardioRegistros} selected={selected} />}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link href={TABS[tab].href} className="flex items-center gap-1.5 font-medium min-h-[44px] hover:underline underline-offset-4">
            {TABS[tab].link} <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <div role="group" aria-label="Escolher resumo" className="flex gap-1 p-1 rounded-full bg-[#3a3032] dark:bg-[#e9e1e0]">
            {(Object.keys(TABS) as Tab[]).map(t => {
              const I = TABS[t].icon
              const on = t === tab
              return (
                <button key={t} onClick={() => setTab(t)} aria-label={TABS[t].titulo} aria-pressed={on}
                  className={cn('h-11 w-11 rounded-full flex items-center justify-center transition-colors duration-150',
                    on ? 'bg-[#f8f3f2] text-[#2c2325] dark:bg-[#2c2325] dark:text-[#f8f3f2]' : 'opacity-60 hover:opacity-100')}>
                  <I className="h-5 w-5" strokeWidth={1.75} />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Progresso */}
      <SectionTitle right={<Link href="/dashboard/progresso" className="link-rose min-h-[44px] flex items-center">Ver fotos</Link>}>Progresso</SectionTitle>
      <ProgressoCard avaliacoes={p.avaliacoes} />
      {p.plano?.agua_litros ? (
        <div className="app-card mt-3 p-4 flex items-center gap-4">
          <IconChip icon={Droplets} color={CORES.cardio} tint={CORES.cardioTint} size={48} />
          <div>
            <p className="text-[28px] leading-[1.1] tracking-[-0.03em] text-foreground">{String(p.plano.agua_litros).replace('.', ',')} L</p>
            <p className="text-xs font-medium text-muted-foreground">Meta de água por dia</p>
          </div>
        </div>
      ) : null}
    </AppScreen>
  )
}

function StreakRow({ icon: Icon, label, v }: { icon: any; label: string; v: number }) {
  return (
    <div className="flex items-center gap-2 text-sm h-6">
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{v > 0 ? dias(v) : '—'}</span>
    </div>
  )
}

function Dot({ color, on }: { color: string; on: boolean }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? color : 'currentColor', opacity: on ? 1 : 0.2 }} />
}

const TABS: Record<Tab, { titulo: string; icon: any; href: string; link: string }> = {
  treino: { titulo: 'Treino', icon: Dumbbell, href: '/dashboard/treinos', link: 'Ver treinos' },
  dieta: { titulo: 'Dieta', icon: Utensils, href: '/dashboard/dieta', link: 'Ver dieta' },
  cardio: { titulo: 'Cardio', icon: HeartPulse, href: '/dashboard/cardio', link: 'Ver cardio' },
}

const PANEL_TRACK = 'rgba(128,118,120,0.35)'

function Big({ v, unit, of }: { v: string; unit: string; of?: string }) {
  return (
    <p className="flex items-baseline gap-2 flex-wrap">
      <span className="text-[44px] leading-none tracking-[-0.04em]">{v}</span>
      <span className="text-lg opacity-70">{of ? `${unit} ${of}` : unit}</span>
    </p>
  )
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-4 opacity-80">{texto}</p>
}

function TreinoResumo({ treinos, progressoes, selected, treinoDays }: Props & { selected: string; treinoDays: Set<string> }) {
  if (!treinos.length) return <Vazio texto="Nenhum treino prescrito ainda." />

  const feitos = Array.from(new Set(progressoes.filter(x => x.data_registro === selected).map(x => x.treino_id)))
    .map(id => treinos.find(t => t.id === id)).filter(Boolean) as Props['treinos']
  const anteriores = progressoes.filter(x => x.data_registro < selected).sort((a, b) => b.data_registro.localeCompare(a.data_registro))
  const ultimoIdx = anteriores.length ? treinos.findIndex(t => t.id === anteriores[0].treino_id) : -1
  const proxIdx = (ultimoIdx + 1) % treinos.length
  const prox = treinos[proxIdx]
  const naSemana = weekDays(parseKey(selected)).map(dateKey).filter(k => treinoDays.has(k)).length
  const rodape = <p className="text-sm opacity-70 mt-3">{naSemana} treino{naSemana !== 1 ? 's' : ''} nesta semana</p>

  if (feitos.length) {
    return (
      <div>
        <p className="flex items-center gap-2 opacity-80"><Check className="h-5 w-5" strokeWidth={2} /> Treino feito</p>
        <p className="text-[32px] leading-tight tracking-[-0.03em] mt-1">{feitos.map(t => t.titulo).join(' + ')}</p>
        {rodape}
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl">{letraTreino(proxIdx)}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium opacity-70">Próximo · {prox.lista_exercicios?.length ?? 0} exercícios</p>
          <p className="text-[28px] leading-tight tracking-[-0.03em] truncate">{prox.titulo}</p>
        </div>
      </div>
      <Link href={`/dashboard/treinos?t=${prox.id}`} className="btn-primary w-full mt-4 h-12">
        <Play className="h-4 w-4 fill-current" /> Iniciar treino
      </Link>
      {rodape}
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
  const pct = meta.kcal ? (cons.kcal / meta.kcal) * 100 : 0
  const falta = meta.kcal - cons.kcal
  return (
    <div>
      <Big v={n(cons.kcal)} unit="de" of={`${n(meta.kcal)} kcal`} />
      <ProgressBar value={pct} color="#e8799f" track={PANEL_TRACK} className="mt-4" />
      <p className="text-sm mt-2 opacity-70">
        {feitas.length} de {refeicoes.length} refeições · {falta > 0 ? `faltam ${n(falta)} kcal` : 'meta atingida'}
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
    <div className="rounded-2xl p-3 bg-[#3a3032] dark:bg-[#e9e1e0]">
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 mb-2">{n(v)} <span className="opacity-70">/ {n(m)} g</span></p>
      <ProgressBar value={m ? (v / m) * 100 : 0} color="currentColor" track={PANEL_TRACK} className="h-1" />
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
      <Big v={String(minSemana)} unit="min" of={metaMin ? `de ${metaMin} na semana` : 'na semana'} />
      {metaMin > 0 && <ProgressBar value={(minSemana / metaMin) * 100} color="#8fb2e3" track={PANEL_TRACK} className="mt-4" />}
      <p className="text-sm mt-2 opacity-70">{daSemana.length}{metaSessoes ? ` de ${metaSessoes}` : ''} sessões nesta semana</p>
      <div className="mt-4 space-y-2">
        {doDia.length ? doDia.map(r => (
          <div key={r.id} className="rounded-2xl px-3 py-2.5 flex items-center gap-2 bg-[#3a3032] dark:bg-[#e9e1e0]">
            <Check className="h-4 w-4" strokeWidth={2} /><span className="flex-1">{r.tipo}</span>
            <span className="opacity-70">{r.duracao_min ? `${r.duracao_min} min` : ''}</span>
          </div>
        )) : <p className="text-sm opacity-70">Nenhum cardio registrado neste dia.</p>}
      </div>
    </div>
  )
}

function ProgressoCard({ avaliacoes }: { avaliacoes: Props['avaliacoes'] }) {
  const [ult, ant] = avaliacoes
  if (!ult?.peso) {
    return (
      <div className="app-card p-4 flex items-center gap-4">
        <IconChip icon={Scale} color="hsl(var(--foreground))" tint="hsl(var(--muted))" size={48} />
        <p className="text-muted-foreground">Sua primeira avaliação física aparece aqui.</p>
      </div>
    )
  }
  const diff = ant?.peso ? Number(ult.peso) - Number(ant.peso) : null
  return (
    <Link href="/dashboard/progresso" className="lift app-card p-4 flex items-center gap-4">
      <IconChip icon={Scale} color="hsl(var(--foreground))" tint="hsl(var(--muted))" size={48} />
      <div className="flex-1 min-w-0">
        <p className="text-[28px] leading-[1.1] tracking-[-0.03em] text-foreground">{String(ult.peso).replace('.', ',')} kg</p>
        <p className="text-xs font-medium text-muted-foreground">
          Avaliação de {format(new Date(ult.created_at), "d 'de' MMM", { locale: ptBR })}
          {diff !== null && diff !== 0 && ` · ${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.', ',')} kg`}
          {ult.percentual_gordura != null && ` · ${String(ult.percentual_gordura).replace('.', ',')}% de gordura`}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
    </Link>
  )
}
