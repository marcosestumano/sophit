'use client'

import { useState } from 'react'
import { Utensils, Plus, Pencil, Loader2 } from 'lucide-react'
import { useDieta } from './useDieta'
import { PlanoEditor, RefeicaoEditor } from './Editores'
import { RefeicaoCard } from './RefeicaoCard'
import { somaMacros, round } from '@/lib/dieta'
import type { DietaRefeicao } from '@/types'

export function DietaAdmin({ userId }: { userId: string }) {
  const d = useDieta(userId)
  const [planoOpen, setPlanoOpen] = useState(false)
  const [refEdit, setRefEdit] = useState<DietaRefeicao | null | undefined>(undefined)
  const tot = somaMacros(d.refeicoes)

  async function excluir(r: DietaRefeicao) {
    if (!confirm(`Excluir "${r.nome}"?`)) return
    await d.excluirRefeicao(r.id)
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-normal text-foreground flex items-center gap-2">
          <Utensils className="h-4 w-4 text-brand-500" /> Plano alimentar
        </h2>
        {d.plano && (
          <button onClick={() => setPlanoOpen(true)} className="btn-secondary text-xs px-3 py-1.5"><Pencil className="h-3.5 w-3.5" /> Editar plano</button>
        )}
      </div>

      {d.loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-500" /> :
        d.erro ? <p className="text-sm text-destructive">{d.erro}</p> :
        !d.plano ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Este aluno ainda não tem plano alimentar.</p>
            <button onClick={() => setPlanoOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Criar plano alimentar</button>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-3 mb-4 text-sm">
              <p className="font-medium text-foreground">{d.plano.titulo}</p>
              <p className="text-muted-foreground mt-0.5">
                Meta: {round(d.plano.meta_kcal || tot.kcal)} kcal · P {round(d.plano.meta_proteina || tot.proteina)}g · C {round(d.plano.meta_carbo || tot.carbo)}g · G {round(d.plano.meta_gordura || tot.gordura)}g
                {d.plano.agua_litros != null && ` · Água ${String(d.plano.agua_litros).replace('.', ',')} L`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Soma das refeições: {round(tot.kcal)} kcal</p>
            </div>
            <div className="space-y-3">
              {d.refeicoes.map(r => (
                <RefeicaoCard key={r.id} refeicao={r} onEdit={() => setRefEdit(r)} onDelete={() => excluir(r)} />
              ))}
              {d.refeicoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma refeição cadastrada.</p>}
            </div>
            <button onClick={() => setRefEdit(null)} className="btn-secondary w-full mt-3"><Plus className="h-4 w-4" /> Adicionar refeição</button>
          </>
        )}

      <PlanoEditor open={planoOpen} onClose={() => setPlanoOpen(false)} plano={d.plano} onSave={d.salvarPlano} />
      <RefeicaoEditor open={refEdit !== undefined} onClose={() => setRefEdit(undefined)} refeicao={refEdit ?? null} onSave={d.salvarRefeicao} />
    </div>
  )
}
