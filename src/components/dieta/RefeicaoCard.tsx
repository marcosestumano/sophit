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
  const resumo = refeicao.alimentos.map(a => [a.quantidade, a.nome].filter(Boolean).join(' ')).join(' · ')
  const qtd = refeicao.alimentos.length

  return (
    <div className="app-card p-4 flex gap-4">
      <p className="w-[52px] flex-shrink-0 text-lg text-foreground">{refeicao.horario?.slice(0, 5) ?? '—'}</p>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={cn('flex-1 text-lg font-medium pt-1.5', checked ? 'text-muted-foreground' : 'text-foreground')}>{refeicao.nome}</p>
          {onToggle && (
            <button onClick={onToggle} aria-pressed={!!checked}
              aria-label={checked ? `Desmarcar ${refeicao.nome}` : `Marcar ${refeicao.nome} como feita`}
              className={cn('press h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150',
                checked ? 'bg-dieta text-white' : 'border-[1.5px] border-border text-transparent hover:text-muted-foreground')}>
              <Check className="h-5 w-5" strokeWidth={2.2} />
            </button>
          )}
        </div>
        {resumo && <p className="text-muted-foreground truncate">{resumo}</p>}
        <p className="text-sm mt-1.5">
          <span className="font-medium text-foreground">{round(m.kcal)} kcal</span>
          <span className="text-muted-foreground"> · {round(m.proteina)} g P · {round(m.carbo)} g C · {round(m.gordura)} g G</span>
        </p>

        <div className="flex items-center gap-1 mt-1">
          {qtd > 0 && (
            <button onClick={() => setAberto(v => !v)} aria-expanded={aberto} className="link-rose flex items-center gap-1 min-h-[44px] text-sm">
              {aberto ? 'Ocultar alimentos' : `Ver ${qtd} alimento${qtd !== 1 ? 's' : ''}`}
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-150', aberto && 'rotate-180')} strokeWidth={1.75} />
            </button>
          )}
          <span className="flex-1" />
          {onEdit && <button onClick={onEdit} className="h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Editar ${refeicao.nome}`}><Pencil className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>}
          {onDelete && <button onClick={onDelete} className="h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Excluir ${refeicao.nome}`}><Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>}
        </div>

        {aberto && (
          <ul className="mt-1 space-y-1.5">
            {refeicao.alimentos.map((a, i) => (
              <li key={i} className="flex justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                <span className="text-foreground">{a.quantidade && <span className="text-muted-foreground">{a.quantidade} · </span>}{a.nome}</span>
                <span className="text-muted-foreground whitespace-nowrap">{a.kcal != null ? `${round(a.kcal)} kcal` : ''}</span>
              </li>
            ))}
            {refeicao.observacoes && <li className="text-sm text-muted-foreground px-1 pt-1">{refeicao.observacoes}</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
