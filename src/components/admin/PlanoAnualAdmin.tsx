'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Copy, Loader2, Plus, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { dateKey } from '@/lib/dates'
import { TreinosListAdmin } from '@/components/admin/TreinosListAdmin'
import { EvolucaoAnual } from '@/components/treinos/EvolucaoAnual'
import {
  anoDe, mesDoTreino, mesKey, mesKeyDe, MESES_CURTOS, nomeMes, nomeMesAno, somaMes,
} from '@/lib/periodizacao'
import { sortTreinos, cn } from '@/lib/utils'
import type { Exercicio } from '@/types'

interface Treino {
  id: string; titulo: string; descricao: string | null; lista_exercicios: Exercicio[]
  data_atribuicao: string; ativo: boolean; user_id: string
  ordem?: number | null; mes_referencia?: string | null
}

export function PlanoAnualAdmin({ userId, treinos }: { userId: string; treinos: Treino[] }) {
  const supabase = createClient()
  const router = useRouter()
  const hoje = mesKey()
  const [ano, setAno] = useState(anoDe(hoje))
  const [mesSel, setMesSel] = useState(hoje)
  const [copiando, setCopiando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Ao trocar de ano, abre o mês atual (se for o ano corrente) ou janeiro
  useEffect(() => {
    if (anoDe(mesSel) !== ano) setMesSel(ano === anoDe(hoje) ? hoje : mesKeyDe(ano, 1))
  }, [ano])

  const porMes = useMemo(() => {
    const m = new Map<string, Treino[]>()
    for (const t of treinos) {
      const k = mesDoTreino(t)
      m.set(k, [...(m.get(k) ?? []), t])
    }
    return m
  }, [treinos])

  const doMes = useMemo(() => sortTreinos(porMes.get(mesSel) ?? []), [porMes, mesSel])

  // Mês anterior mais próximo que tem treinos (base para copiar)
  const mesBase = useMemo(() => {
    const anteriores = Array.from(porMes.keys()).filter(k => k < mesSel).sort()
    return anteriores[anteriores.length - 1] ?? null
  }, [porMes, mesSel])

  async function copiarDe(origem: string) {
    setCopiando(true)
    setErro(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCopiando(false); setErro('Sua sessão expirou. Entre de novo.'); return }
    const base = sortTreinos(porMes.get(origem) ?? [])
    const inicio = doMes.length
    const { error } = await supabase.from('treinos').insert(base.map((t, i) => ({
      user_id: userId,
      admin_id: user.id,
      titulo: t.titulo,
      descricao: t.descricao,
      lista_exercicios: t.lista_exercicios,
      data_atribuicao: mesSel === hoje ? dateKey() : mesSel,
      mes_referencia: mesSel,
      ativo: true,
      ordem: inicio + i,
    })))
    setCopiando(false)
    if (error) {
      setErro(error.message.includes('mes_referencia')
        ? 'A coluna "mes_referencia" não existe no banco. Rode a migration 004_treinos_mensais.sql no Supabase.'
        : `Não foi possível copiar: ${error.message}`)
      return
    }
    router.refresh()
  }

  return (
    <div className="card p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl tracking-[-0.02em] font-normal text-foreground">Planejamento anual de treinos</h2>
          <p className="text-sm text-muted-foreground">Monte os treinos de cada mês. O aluno vê os do mês atual.</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAno(a => a - 1)} aria-label="Ano anterior"
            className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-14 text-center text-lg text-foreground tabular-nums">{ano}</span>
          <button onClick={() => setAno(a => a + 1)} aria-label="Próximo ano"
            className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 12 meses */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2" role="tablist" aria-label={`Meses de ${ano}`}>
        {MESES_CURTOS.map((nome, i) => {
          const key = mesKeyDe(ano, i + 1)
          const qtd = porMes.get(key)?.length ?? 0
          const sel = key === mesSel
          const atual = key === hoje
          return (
            <button key={key} role="tab" aria-selected={sel} onClick={() => setMesSel(key)}
              className={cn('rounded-lg border px-2 py-2 text-left transition-colors min-h-[56px]',
                sel ? 'border-brand-500 bg-brand-500/10' : 'border-border hover:bg-muted/40',
                key < hoje && qtd === 0 && !sel && 'opacity-60')}>
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {nome}
                {atual && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-label="mês atual" />}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {qtd ? `${qtd} treino${qtd !== 1 ? 's' : ''}` : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mês selecionado */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" style={{ color: 'var(--rose-text)' }} />
            <h3 className="font-medium text-foreground">Treinos de {nomeMesAno(mesSel)}</h3>
            {mesSel === hoje && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/30">Mês atual</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mesBase && (
              <button onClick={() => copiarDe(mesBase)} disabled={copiando} className="btn-secondary text-xs gap-1.5">
                {copiando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                Copiar treinos de {nomeMes(mesBase)}{anoDe(mesBase) !== anoDe(mesSel) ? ` ${anoDe(mesBase)}` : ''}
              </button>
            )}
            <Link href={`/admin/treinos?aluno=${userId}&mes=${mesSel.slice(0, 7)}`} className="btn-primary text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Novo treino
            </Link>
          </div>
        </div>

        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

        {doMes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-foreground">Nenhum treino montado para {nomeMes(mesSel).toLowerCase()}.</p>
            <p className="text-xs text-muted-foreground mt-1">
              {mesSel >= hoje && mesBase
                ? `Enquanto não houver treinos aqui, o aluno continua com os de ${nomeMes(mesBase).toLowerCase()}.`
                : 'Crie um treino novo ou copie os de um mês anterior para ajustar.'}
            </p>
          </div>
        ) : (
          <TreinosListAdmin treinos={doMes} userId={userId} />
        )}
      </div>

      {/* Evolução do ano */}
      <div className="pt-2 border-t border-border">
        <h3 className="text-lg tracking-[-0.01em] font-normal text-foreground mt-4 mb-3">Evolução em {ano}</h3>
        <EvolucaoAnual userId={userId} treinos={treinos} ano={ano} variante="admin" />
      </div>
    </div>
  )
}
