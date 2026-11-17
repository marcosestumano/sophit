'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, HeartPulse, Plus, Trash2, Timer, Route, Flame, Loader2, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell, HeroTitle, Chip, ProgressBar, CORES } from '@/components/app/AppShell'
import { RegistroCardioSheet, type RegistroInput } from './RegistroCardioSheet'
import { dateKey, weekDays, DIAS_CURTOS, parseKey } from '@/lib/dates'
import type { CardioPrescricao, CardioRegistro } from '@/types'
import { cn } from '@/lib/utils'

export function CardioView({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const todayKey = dateKey()
  const [ref, setRef] = useState(new Date())
  const [selected, setSelected] = useState(todayKey)
  const [prescricoes, setPrescricoes] = useState<CardioPrescricao[]>([])
  const [registros, setRegistros] = useState<CardioRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sheet, setSheet] = useState(false)

  const dias = weekDays(ref)
  const ini = dateKey(dias[0]), fim = dateKey(dias[6])
  const semanaAtual = dias.some(d => dateKey(d) === todayKey)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [p, r] = await Promise.all([
      supabase.from('cardio_prescricoes').select('*').eq('user_id', userId).eq('ativo', true).order('created_at'),
      supabase.from('cardio_registros').select('*').eq('user_id', userId).gte('data', ini).lte('data', fim).order('created_at'),
    ])
    if (p.error || r.error) {
      const msg = (p.error ?? r.error)!.message
      setErro(msg.includes('cardio_') ? 'As tabelas de cardio ainda não existem. Rode a migration 003_dieta_cardio.sql no Supabase.' : 'Erro ao carregar cardios.')
    } else setErro(null)
    setPrescricoes((p.data ?? []) as CardioPrescricao[])
    setRegistros((r.data ?? []) as CardioRegistro[])
    setLoading(false)
  }, [supabase, userId, ini, fim])

  useEffect(() => { carregar() }, [carregar])

  function mudarSemana(n: number) {
    const novo = addWeeks(ref, n)
    setRef(novo)
    const ks = weekDays(novo).map(dateKey)
    setSelected(ks.includes(todayKey) ? todayKey : ks[0])
  }

  async function salvar(r: RegistroInput) {
    const { error } = await supabase.from('cardio_registros').insert({ ...r, user_id: userId })
    if (error) throw error
    if (r.data < ini || r.data > fim) setRef(parseKey(r.data))
    setSelected(r.data)
    await carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este registro de cardio?')) return
    await supabase.from('cardio_registros').delete().eq('id', id)
    setRegistros(rs => rs.filter(x => x.id !== id))
  }

  const minDia = (k: string) => registros.filter(r => r.data === k).reduce((s, r) => s + (r.duracao_min ?? 0), 0)
  const totalMin = registros.reduce((s, r) => s + (r.duracao_min ?? 0), 0)
  const doDia = registros.filter(r => r.data === selected)
  const feitosDaPresc = (p: CardioPrescricao) =>
    registros.filter(r => r.prescricao_id === p.id || (!r.prescricao_id && r.tipo.toLowerCase() === p.tipo.toLowerCase())).length

  return (
    <AppShell
      hero={
        <>
          <HeroTitle title="Cardio" />
          <div className="mt-3 flex gap-2 flex-wrap">
            <Chip><HeartPulse className="h-4 w-4" /> {registros.length} sess{registros.length !== 1 ? 'ões' : 'ão'}</Chip>
            <Chip><Timer className="h-4 w-4" /> {totalMin} min na semana</Chip>
          </div>
        </>
      }
    >
      {/* Navegação da semana */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => mudarSemana(-1)} className="p-2 rounded-full hover:bg-muted" aria-label="Semana anterior"><ChevronLeft className="h-5 w-5" /></button>
        <p className="text-sm font-semibold text-foreground">
          {semanaAtual ? 'Esta semana' : `${format(dias[0], 'dd/MM')} – ${format(dias[6], 'dd/MM')}`}
        </p>
        <button onClick={() => mudarSemana(1)} className="p-2 rounded-full hover:bg-muted" aria-label="Próxima semana"><ChevronRight className="h-5 w-5" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {dias.map((d, i) => {
          const k = dateKey(d)
          const min = minDia(k)
          const ativo = k === selected
          return (
            <button key={k} onClick={() => setSelected(k)}
              className={cn('rounded-2xl py-2.5 flex flex-col items-center gap-1 border transition-colors',
                ativo ? 'border-transparent text-white' : 'border-border text-foreground', k === todayKey && !ativo && 'border-brand-300')}
              style={ativo ? { background: 'linear-gradient(160deg,#c4b5fd,#8b6fe0)' } : undefined}>
              <span className={cn('text-[11px] font-semibold', !ativo && 'text-muted-foreground')}>{DIAS_CURTOS[i]}</span>
              <span className="text-lg font-bold leading-none">{format(d, 'd')}</span>
              <span className={cn('text-[10px] font-semibold h-3', min ? '' : 'opacity-0')} style={!ativo ? { color: CORES.cardio } : undefined}>
                {min ? `${min}′` : '·'}
              </span>
            </button>
          )
        })}
      </div>

      {erro && <div className="app-card p-4 text-sm text-destructive mb-4">{erro}</div>}

      {/* Prescrições */}
      {prescricoes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Seu cardio prescrito</h2>
          <div className="space-y-3">
            {prescricoes.map(p => {
              const feitos = feitosDaPresc(p)
              const meta = p.frequencia_semana ?? 0
              return (
                <div key={p.id} className="app-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.18)' }}>
                      <Target className="h-5 w-5" style={{ color: CORES.cardio }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{p.tipo}</p>
                      <p className="text-sm text-muted-foreground">
                        {[p.duracao_min && `${p.duracao_min} min`, p.frequencia_semana && `${p.frequencia_semana}x por semana`, p.intensidade].filter(Boolean).join(' · ')}
                      </p>
                      {p.observacoes && <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>}
                    </div>
                    {meta > 0 && <span className="text-sm font-bold text-foreground whitespace-nowrap">{feitos}/{meta}</span>}
                  </div>
                  {meta > 0 && <ProgressBar value={(feitos / meta) * 100} color={CORES.cardio} className="mt-3" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dia selecionado */}
      <h2 className="text-lg font-bold text-foreground mb-3 capitalize">
        {selected === todayKey ? 'Hoje' : format(parseKey(selected), "EEEE, dd 'de' MMM", { locale: ptBR })}
      </h2>
      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
      ) : doDia.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-muted-foreground">Nenhum cardio registrado neste dia.</div>
      ) : (
        <div className="space-y-3">
          {doDia.map(r => (
            <div key={r.id} className="app-card p-4 flex items-start gap-3">
              <span className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: CORES.cardio }}>
                <HeartPulse className="h-5 w-5 text-white" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{r.tipo}{r.intensidade && <span className="font-normal text-muted-foreground"> · {r.intensidade}</span>}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  {r.duracao_min != null && <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{r.duracao_min} min</span>}
                  {r.distancia_km != null && <span className="flex items-center gap-1"><Route className="h-3.5 w-3.5" />{String(r.distancia_km).replace('.', ',')} km</span>}
                  {r.calorias != null && <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{r.calorias} kcal</span>}
                </div>
                {r.observacoes && <p className="text-xs text-muted-foreground mt-1">{r.observacoes}</p>}
              </div>
              <button onClick={() => excluir(r.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setSheet(true)} disabled={!!erro} className="btn-primary w-full rounded-2xl py-3 mt-5 text-base">
        <Plus className="h-5 w-5" /> Registrar cardio
      </button>

      <RegistroCardioSheet open={sheet} onClose={() => setSheet(false)} data={selected} prescricoes={prescricoes} onSave={salvar} />
    </AppShell>
  )
}
