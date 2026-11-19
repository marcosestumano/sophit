'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { evolucaoAnual, mesKey, MESES, MESES_CURTOS, type RegistroCarga, type TreinoMensal } from '@/lib/periodizacao'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  treinos: TreinoMensal[]
  /** Controlado pelo pai (painel admin). Sem ele, o componente tem o próprio seletor de ano. */
  ano?: number
  /** 'aluno' usa o visual do app; 'admin' o do painel. */
  variante?: 'aluno' | 'admin'
}

const PAGINA = 1000

/** Busca todos os registros do ano (o Supabase devolve no máximo 1000 por vez). */
async function buscarRegistros(userId: string, ano: number): Promise<{ data: RegistroCarga[]; erro: string | null }> {
  const supabase = createClient()
  const todos: RegistroCarga[] = []
  for (let de = 0; de < 50_000; de += PAGINA) {
    const { data, error } = await supabase
      .from('progressao_exercicios')
      .select('treino_id, exercicio_nome, carga, data_registro')
      .eq('user_id', userId)
      .gte('data_registro', `${ano}-01-01`)
      .lte('data_registro', `${ano}-12-31`)
      .order('data_registro', { ascending: true })
      .range(de, de + PAGINA - 1)
    if (error) return { data: todos, erro: error.message }
    todos.push(...((data ?? []) as RegistroCarga[]))
    if (!data || data.length < PAGINA) break
  }
  return { data: todos, erro: null }
}

export function EvolucaoAnual({ userId, treinos, ano: anoControlado, variante = 'aluno' }: Props) {
  const hoje = mesKey()
  const anoAtual = Number(hoje.slice(0, 4))
  const [anoInterno, setAnoInterno] = useState(anoAtual)
  const ano = anoControlado ?? anoInterno

  const [registros, setRegistros] = useState<RegistroCarga[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    setErro(null)
    buscarRegistros(userId, ano).then(({ data, erro }) => {
      if (!vivo) return
      setRegistros(data)
      setErro(erro)
      setCarregando(false)
    })
    return () => { vivo = false }
  }, [userId, ano])

  const ev = useMemo(() => evolucaoAnual(registros, treinos, ano), [registros, treinos, ano])
  const card = variante === 'aluno' ? 'app-card' : 'rounded-xl border border-border'
  const chartData = ev.meses.map(m => ({
    mes: MESES_CURTOS[m.mes - 1], nome: MESES[m.mes - 1], dias: m.diasTreinados,
    treinos: m.treinosNoPlano, atual: m.key === hoje,
  }))
  const temDados = registros.length > 0

  return (
    <section className="space-y-4">
      {anoControlado === undefined && (
        <div className="flex items-center justify-between">
          <button onClick={() => setAnoInterno(a => a - 1)} aria-label="Ano anterior"
            className="press h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <p className="text-xl tracking-[-0.01em] text-foreground">{ano}</p>
          <button onClick={() => setAnoInterno(a => a + 1)} disabled={ano >= anoAtual} aria-label="Próximo ano"
            className="press h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-30">
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar as cargas de {ano}: {erro}</p>
      )}

      {/* Resumo do ano */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat card={card} valor={ev.resumo.diasTreinados} rotulo="dias treinados" />
        <Stat card={card} valor={`${ev.resumo.mesesComPlano}/12`} rotulo="meses com plano" />
        <Stat card={card}
          valor={ev.resumo.exerciciosComparaveis ? `${ev.resumo.exerciciosEvoluindo}/${ev.resumo.exerciciosComparaveis}` : '–'}
          rotulo="exercícios com carga maior" />
      </div>

      {/* Dias treinados por mês */}
      <div className={cn(card, 'p-4')}>
        <p className="text-sm font-medium text-foreground">Dias treinados por mês</p>
        <p className="text-xs text-muted-foreground mb-3">Dias com pelo menos uma carga registrada</p>
        {carregando ? (
          <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip cursor={{ fill: 'rgba(232,121,159,0.08)' }} content={<TooltipMes />} />
              <Bar dataKey="dias" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {chartData.map(d => (
                  <Cell key={d.mes} fill={d.atual ? '#d45f88' : '#e8799f'} fillOpacity={d.atual ? 1 : 0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Carga máxima por mês, por exercício */}
      <div className={cn(card, 'p-4')}>
        <p className="text-sm font-medium text-foreground">Carga máxima por mês</p>
        <p className="text-xs text-muted-foreground mb-3">Maior carga registrada em cada mês e a diferença entre o primeiro e o último mês</p>
        {carregando ? (
          <div className="h-24 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !temDados ? (
          <div className="rounded-lg bg-muted/30 border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma carga registrada em {ano}. Conforme os treinos forem registrados, a evolução aparece aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs border-separate border-spacing-0 min-w-[720px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th scope="col" className="text-left font-medium py-2 pr-3 sticky left-0 bg-card z-10">Exercício</th>
                  {MESES_CURTOS.map((m, i) => (
                    <th key={m} scope="col" className={cn('font-medium py-2 px-1 text-right tabular-nums',
                      ev.meses[i].key === hoje && 'text-foreground')}>{m}</th>
                  ))}
                  <th scope="col" className="font-medium py-2 pl-3 text-right">Evolução</th>
                </tr>
              </thead>
              <tbody>
                {ev.exercicios.map(e => (
                  <tr key={e.nome} className="border-t border-border">
                    <th scope="row" className="text-left font-medium text-foreground py-2 pr-3 border-t border-border sticky left-0 bg-card z-10 max-w-[180px] truncate">
                      {e.nome}
                    </th>
                    {e.porMes.map((v, i) => (
                      <td key={i} className={cn('py-2 px-1 text-right tabular-nums border-t border-border',
                        v === null ? 'text-muted-foreground/50' : 'text-foreground')}>
                        {v === null ? '–' : v}
                      </td>
                    ))}
                    <td className="py-2 pl-3 text-right border-t border-border whitespace-nowrap">
                      <Ganho e={e} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground mt-2">Valores em kg.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function Stat({ card, valor, rotulo }: { card: string; valor: number | string; rotulo: string }) {
  return (
    <div className={cn(card, 'p-3 sm:p-4')}>
      <p className="text-[26px] leading-none tracking-[-0.03em] text-foreground tabular-nums">{valor}</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{rotulo}</p>
    </div>
  )
}

function Ganho({ e }: { e: { ganho: number; ganhoPct: number | null; mesesComRegistro: number } }) {
  if (e.mesesComRegistro < 2) return <span className="text-muted-foreground">1 mês</span>
  const Icone = e.ganho > 0 ? TrendingUp : e.ganho < 0 ? TrendingDown : Minus
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium',
      e.ganho > 0 ? 'text-dieta' : e.ganho < 0 ? 'text-destructive' : 'text-muted-foreground')}>
      <Icone className="h-3.5 w-3.5" aria-hidden="true" />
      {e.ganho > 0 ? '+' : ''}{e.ganho} kg
      {e.ganhoPct !== null && e.ganho !== 0 && <span className="font-normal text-muted-foreground">({e.ganhoPct > 0 ? '+' : ''}{e.ganhoPct}%)</span>}
    </span>
  )
}

function TooltipMes({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card p-3 text-xs shadow-lg">
      <p className="font-medium text-foreground">{d.nome}</p>
      <p className="text-foreground mt-1">{d.dias} dia{d.dias !== 1 ? 's' : ''} treinado{d.dias !== 1 ? 's' : ''}</p>
      <p className="text-muted-foreground">{d.treinos ? `${d.treinos} treino${d.treinos !== 1 ? 's' : ''} no plano` : 'Sem plano montado'}</p>
    </div>
  )
}
