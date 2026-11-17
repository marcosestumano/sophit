'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, HeartPulse, Plus, Trash2, Timer, Route, Flame, Loader2, Check, Play } from 'lucide-react'
import { useCronometroCardio, CronometroCard, IniciarCardioSheet, minutosDe } from './CronometroCardio'
import { createClient } from '@/lib/supabase/client'
import { AppScreen, ScreenHeader, SectionTitle, ProgressBar, IconChip, CORES } from '@/components/app/AppShell'
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
  const [sheetIniciar, setSheetIniciar] = useState(false)
  const [inicial, setInicial] = useState<{ tipo: string; prescricao_id: string | null; duracao_min: number } | null>(null)
  const cr = useCronometroCardio()

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

  function finalizarCronometro() {
    if (!cr.crono) return
    cr.pausar()
    setInicial({ tipo: cr.crono.tipo, prescricao_id: cr.crono.prescricao_id, duracao_min: minutosDe(cr.decorridoMs) })
    setSheet(true)
  }

  function fecharRegistro() { setSheet(false); setInicial(null) }

  async function salvar(r: RegistroInput) {
    const { error } = await supabase.from('cardio_registros').insert({ ...r, user_id: userId })
    if (error) throw error
    if (inicial) cr.limpar()
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

  const sub = `${semanaAtual ? 'Esta semana' : 'Semana'} · ${registros.length} sess${registros.length !== 1 ? 'ões' : 'ão'} · ${totalMin} min`
  const btnSeta = 'press h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted'

  return (
    <AppScreen>
      <ScreenHeader title="Cardio" sub={sub} />

      <div className="flex items-center justify-between mt-2">
        <button onClick={() => mudarSemana(-1)} className={btnSeta} aria-label="Semana anterior"><ChevronLeft className="h-5 w-5" strokeWidth={1.75} /></button>
        <p className="font-medium text-foreground">
          {format(dias[0], 'd')} a {format(dias[6], "d 'de' MMMM", { locale: ptBR })}
        </p>
        <button onClick={() => mudarSemana(1)} className={btnSeta} aria-label="Próxima semana"><ChevronRight className="h-5 w-5" strokeWidth={1.75} /></button>
      </div>

      <div className="flex justify-between mt-2">
        {dias.map((d, i) => {
          const k = dateKey(d)
          const min = minDia(k)
          const ativo = k === selected
          return (
            <button key={k} onClick={() => setSelected(k)} aria-pressed={ativo}
              aria-label={`${format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}${min ? `, ${min} minutos` : ''}`}
              className={cn('press w-[42px] h-[72px] rounded-2xl border flex flex-col items-center justify-center transition-colors duration-150',
                ativo ? 'bg-[#2c2325] border-[#2c2325] text-[#f8f3f2] dark:bg-[#f8f3f2] dark:border-[#f8f3f2] dark:text-[#2c2325]' : 'bg-card border-border text-foreground',
                k === todayKey && !ativo && 'border-primary')}>
              <span className={cn('text-xs font-medium', ativo ? 'opacity-70' : 'text-muted-foreground')}>{DIAS_CURTOS[i]}</span>
              <span className="text-lg leading-tight">{format(d, 'd')}</span>
              <span className={cn('text-xs font-medium', !min && 'opacity-0')} style={!ativo ? { color: CORES.cardio } : undefined}>{min ? `${min}′` : '·'}</span>
            </button>
          )
        })}
      </div>

      {cr.crono && (
        <CronometroCard crono={cr.crono} decorridoMs={cr.decorridoMs} rodando={cr.rodando}
          onPausar={cr.pausar} onRetomar={cr.retomar} onFinalizar={finalizarCronometro}
          onDescartar={() => { if (confirm('Descartar o tempo cronometrado?')) cr.limpar() }} />
      )}

      {erro && <div className="app-card p-4 mt-4 text-destructive">{erro}</div>}

      {prescricoes.length > 0 && (
        <>
          <SectionTitle>Seu cardio prescrito</SectionTitle>
          <div className="space-y-3">
            {prescricoes.map(p => {
              const feitos = feitosDaPresc(p)
              const meta = p.frequencia_semana ?? 0
              return (
                <div key={p.id} className="app-card p-4">
                  <div className="flex items-center gap-4">
                    <IconChip icon={HeartPulse} color={CORES.cardio} tint={CORES.cardioTint} size={48} />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-foreground">{p.tipo}</p>
                      <p className="text-muted-foreground">
                        {[p.duracao_min && `${p.duracao_min} min`, p.frequencia_semana && `${p.frequencia_semana} vez${p.frequencia_semana !== 1 ? 'es' : ''} por semana`, p.intensidade?.toLowerCase()].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  {p.observacoes && <p className="text-muted-foreground mt-3">{p.observacoes}</p>}
                  {!cr.crono && !erro && (
                    <button onClick={() => cr.iniciar({ tipo: p.tipo, prescricao_id: p.id, meta_min: p.duracao_min ?? null })}
                      className="btn-secondary w-full h-11 mt-4">
                      <Play className="h-4 w-4" strokeWidth={1.75} /> Iniciar com cronômetro
                    </button>
                  )}
                  {meta > 0 && (
                    <>
                      <div className="flex justify-between mt-4 mb-1.5 text-xs font-medium text-foreground">
                        <span>{semanaAtual ? 'Nesta semana' : 'Na semana'}</span><span>{feitos} de {meta}</span>
                      </div>
                      <ProgressBar value={(feitos / meta) * 100} color={CORES.cardio} />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <SectionTitle>
        <span className="capitalize">{selected === todayKey ? 'Hoje' : format(parseKey(selected), "EEEE, d 'de' MMM", { locale: ptBR })}</span>
      </SectionTitle>
      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : doDia.length === 0 ? (
        <div className="app-card p-6 text-center text-muted-foreground">Nenhum cardio registrado neste dia.</div>
      ) : (
        <div className="space-y-3">
          {doDia.map(r => (
            <div key={r.id} className="app-card p-4 flex items-start gap-4">
              <IconChip icon={Check} color="#ffffff" tint={CORES.cardio} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium text-foreground">{r.tipo}{r.intensidade && <span className="font-normal text-muted-foreground"> · {r.intensidade.toLowerCase()}</span>}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
                  {r.duracao_min != null && <span className="flex items-center gap-1"><Timer className="h-4 w-4" strokeWidth={1.75} />{r.duracao_min} min</span>}
                  {r.distancia_km != null && <span className="flex items-center gap-1"><Route className="h-4 w-4" strokeWidth={1.75} />{String(r.distancia_km).replace('.', ',')} km</span>}
                  {r.calorias != null && <span className="flex items-center gap-1"><Flame className="h-4 w-4" strokeWidth={1.75} />{r.calorias} kcal</span>}
                </div>
                {r.observacoes && <p className="text-muted-foreground mt-1">{r.observacoes}</p>}
              </div>
              <button onClick={() => excluir(r.id)} className="h-11 w-11 -mr-2 -mt-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Excluir ${r.tipo}`}>
                <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      {cr.crono ? (
        <button onClick={finalizarCronometro} className="btn-primary w-full h-12 mt-6">
          <Timer className="h-5 w-5" strokeWidth={1.75} /> Finalizar e salvar cardio
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-6">
          <button onClick={() => setSheet(true)} disabled={!!erro} className="btn-secondary h-12">
            <Plus className="h-5 w-5" /> Registrar
          </button>
          <button onClick={() => setSheetIniciar(true)} disabled={!!erro} className="btn-primary h-12">
            <Timer className="h-5 w-5" strokeWidth={1.75} /> Iniciar cardio
          </button>
        </div>
      )}

      <RegistroCardioSheet open={sheet} onClose={fecharRegistro} data={inicial ? todayKey : selected}
        prescricoes={prescricoes} onSave={salvar} inicial={inicial} />
      <IniciarCardioSheet open={sheetIniciar} onClose={() => setSheetIniciar(false)} prescricoes={prescricoes}
        onStart={d => { cr.iniciar(d); setSheetIniciar(false) }} />
    </AppScreen>
  )
}
