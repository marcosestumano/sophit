'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { dateKey, parseKey } from '@/lib/dates'

interface Check { secao: string; exercicio_nome: string; data: string }

/** Resumo para o profissional: mobilidade e ativação que o aluno marcou como feitas (últimos 30 dias). */
export function PreparoAdmin({ userId, treinoId, temPreparo }: { userId: string; treinoId: string; temPreparo: boolean }) {
  const [checks, setChecks] = useState<Check[] | null>(null)

  useEffect(() => {
    if (!temPreparo) return
    createClient().from('treino_checks').select('secao, exercicio_nome, data')
      .eq('user_id', userId).eq('treino_id', treinoId)
      .gte('data', dateKey(subDays(new Date(), 30)))
      .order('data', { ascending: false })
      .then(({ data, error }) => setChecks(error ? [] : (data ?? []) as Check[]))
  }, [userId, treinoId, temPreparo])

  if (!temPreparo || checks === null) return null

  const dias = Array.from(new Set(checks.map(c => c.data)))
  const ultimo = dias[0]
  const doUltimo = checks.filter(c => c.data === ultimo)
  const resumo = (secao: string) => doUltimo.filter(c => c.secao === secao).length

  return (
    <div className="flex items-start gap-2 text-xs rounded-lg bg-muted/30 p-3 mt-3">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-dieta" />
      {dias.length === 0 ? (
        <p className="text-muted-foreground">Mobilidade/ativação: nenhuma marcação nos últimos 30 dias.</p>
      ) : (
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">Mobilidade/ativação feita em {dias.length} dia{dias.length !== 1 ? 's' : ''}</span> nos últimos 30 dias.
          {' '}Última em {format(parseKey(ultimo), "d 'de' MMM", { locale: ptBR })}
          {resumo('mobilidade') ? ` · ${resumo('mobilidade')} de mobilidade` : ''}
          {resumo('ativacao') ? ` · ${resumo('ativacao')} de ativação` : ''}.
        </p>
      )}
    </div>
  )
}
