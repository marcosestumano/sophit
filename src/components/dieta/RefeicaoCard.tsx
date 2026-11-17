'use client'

import { useState } from 'react'
import { Check, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { macrosAlimentos, round } from '@/lib/dieta'
import type { DietaRefeicao } from '@/types'
import { cn } from '@/lib/utils'

export function RefeicaoCard({ refeicao, checked, onToggle, onEdit, onDelete }: {
  refeicao: DietaRefeicao
  checked?: boolean
  onToggle?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const m = macrosAlimentos(refeicao.alimentos)
  const resumo = refeicao.alimentos.map(a => [a.quantidade, a.nome].filter(Boolean).join(' de ')).join(' · ')

  return (
    <div className="app-card p-4 flex gap-3">
      <div className="w-14 flex-shrink-0 border-r border-border pr-3">
        <p className="text-base font-bold text-foreground">{refeicao.horario?.slice(0, 5) ?? '--:--'}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={cn('flex-1 font-bold text-foreground', checked && 'line-through opacity-60')}>{refeicao.nome}</p>
          {onToggle && (
            <button onClick={onToggle} aria-label={checked ? 'Desmarcar refeição' : 'Marcar refeição como feita'}
              className={cn('h-9 w-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors',
                checked ? 'bg-emerald-500 border-emerald-300 text-white' : 'border-border text-transparent hover:text-muted-foreground')}>
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>
        {resumo && <p className="text-sm text-muted-foreground truncate mt-0.5">{resumo}</p>}
        <p className="text-sm mt-1">
          <b className="text-amber-500">{round(m.kcal)} kcal</b>
          <span className="text-muted-foreground"> {round(m.proteina)}g P · {round(m.carbo)}g C · {round(m.gordura)}g G</span>
        </p>

        <div className="flex items-center gap-3 mt-2">
          {refeicao.alimentos.length > 0 && (
            <button onClick={() => setAberto(v => !v)} className="text-sm font-medium text-brand-600 dark:text-brand-300 flex items-center gap-1">
              {aberto ? 'Ocultar' : `Ver ${refeicao.alimentos.length} alimento${refeicao.alimentos.length !== 1 ? 's' : ''}`}
              <ChevronDown className={cn('h-4 w-4 transition-transform', aberto && 'rotate-180')} />
            </button>
          )}
          <span className="flex-1" />
          {onEdit && <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Editar"><Pencil className="h-4 w-4" /></button>}
          {onDelete && <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>}
        </div>

        {aberto && (
          <ul className="mt-2 space-y-1.5 animate-slide-up">
            {refeicao.alimentos.map((a, i) => (
              <li key={i} className="text-sm flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-foreground">{a.quantidade && <span className="text-muted-foreground">{a.quantidade} · </span>}{a.nome}</span>
                <span className="text-muted-foreground whitespace-nowrap">{a.kcal != null ? `${round(a.kcal)} kcal` : ''}</span>
              </li>
            ))}
            {refeicao.observacoes && <li className="text-xs text-muted-foreground px-1 pt-1">{refeicao.observacoes}</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
