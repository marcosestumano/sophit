'use client'

import { useRef, useState } from 'react'
import { useFieldArray, useWatch, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { TreinoFormData } from '@/lib/validations'
import { agruparPorSecao, novoExercicio, secaoDe, type Secao } from '@/lib/secoes'
import { cn } from '@/lib/utils'

interface Props {
  control: Control<TreinoFormData>
  register: UseFormRegister<TreinoFormData>
  errors: FieldErrors<TreinoFormData>
}

/**
 * Exercícios do treino separados em blocos: Mobilidade, Ativação (opcional) e Treino.
 * Um único array no formulário; cada item carrega `secao`. Arrastar reordena dentro do bloco.
 */
export function ExerciciosSecoes({ control, register, errors }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'lista_exercicios' })
  const valores = useWatch({ control, name: 'lista_exercicios' }) ?? []
  const [aberto, setAberto] = useState<string | null>(null)
  const [ativacaoVisivel, setAtivacaoVisivel] = useState(() => fields.some(f => secaoDe(f) === 'ativacao'))

  const dragFrom = useRef<number | null>(null)
  const dragTo = useRef<number | null>(null)
  const [dragActive, setDragActive] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function adicionar(secao: Secao) {
    append(novoExercicio(secao))
    // abre o novo item (o id só existe depois do render)
    setAberto(`novo-${fields.length}`)
  }

  function onDragEnd() {
    const from = dragFrom.current, to = dragTo.current
    if (from !== null && to !== null && from !== to && secaoDe(fields[from]) === secaoDe(fields[to])) move(from, to)
    dragFrom.current = null; dragTo.current = null
    setDragActive(null); setDragOver(null)
  }

  const erroLista = (errors.lista_exercicios as any)?.root?.message ?? (errors.lista_exercicios as any)?.message
  const grupos = agruparPorSecao(fields)

  return (
    <div className="space-y-4">
      {erroLista && <p role="alert" className="form-error">{erroLista}</p>}

      {grupos.map((g, gi) => {
        if (g.id === 'ativacao' && !ativacaoVisivel && g.itens.length === 0) {
          return (
            <button key={g.id} type="button" onClick={() => { setAtivacaoVisivel(true); adicionar('ativacao') }}
              className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" /> Adicionar bloco de ativação <span className="text-xs">(opcional)</span>
            </button>
          )
        }

        return (
          <section key={g.id} className="rounded-xl border border-border overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 bg-foreground text-background">
                  {gi + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {g.nome}
                    {g.opcional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">opcional</span>}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">({g.itens.length})</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{g.descricao}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {g.id === 'ativacao' && g.itens.length === 0 && (
                  <button type="button" onClick={() => setAtivacaoVisivel(false)} className="btn-ghost text-xs px-2 py-1">
                    Remover bloco
                  </button>
                )}
                <button type="button" onClick={() => adicionar(g.id)} className="btn-secondary text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </header>

            <div className="p-3 space-y-2">
              {g.itens.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {g.id === 'mobilidade' ? 'Sem mobilidade neste treino.' : 'Nenhum exercício ainda.'}
                </p>
              )}

              {g.itens.map(({ item: field, index }, pos) => {
                const id = field.id
                const expandido = aberto === id || aberto === `novo-${index}`
                const nome = valores[index]?.nome
                const isDragging = dragActive === index
                const isOver = dragOver === index && dragActive !== index && dragActive !== null
                  && secaoDe(fields[dragActive]) === g.id
                const errEx = errors.lista_exercicios?.[index]

                return (
                  <div key={id}
                    draggable={!expandido}
                    onDragStart={() => { dragFrom.current = index; setDragActive(index) }}
                    onDragEnter={() => { if (dragFrom.current !== null && secaoDe(fields[dragFrom.current]) === g.id) { dragTo.current = index; setDragOver(index) } }}
                    onDragOver={e => e.preventDefault()}
                    onDragEnd={onDragEnd}
                    className={cn('border rounded-lg overflow-hidden transition-all duration-150',
                      isOver ? 'border-brand-500 bg-brand-500/5' : 'border-border',
                      errEx && !expandido && 'border-destructive')}
                    style={{ opacity: isDragging ? 0.4 : 1 }}
                  >
                    <div className="flex items-center gap-2 p-3 bg-muted/20">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" aria-hidden="true" />
                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style={{ background: 'rgba(232,121,159,0.15)', color: 'var(--rose-text)' }}>
                        {pos + 1}
                      </span>
                      <button type="button" onClick={() => setAberto(expandido ? null : id)}
                        className="flex-1 min-w-0 text-left text-sm font-medium text-foreground truncate">
                        {nome || `Exercício ${pos + 1}`}
                        {!expandido && valores[index] && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {valores[index].series}×{valores[index].reps}{g.id === 'treino' && valores[index].carga ? ` · ${valores[index].carga}` : ''}
                          </span>
                        )}
                      </button>
                      <button type="button" onClick={() => remove(index)} aria-label="Remover exercício"
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setAberto(expandido ? null : id)} aria-label={expandido ? 'Recolher' : 'Expandir'}
                        className="text-muted-foreground p-1">
                        {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {expandido && (
                      <div className="p-4 grid grid-cols-2 gap-3 animate-slide-up">
                        <div className="col-span-2">
                          <label className="form-label text-xs">Nome do exercício</label>
                          <input {...register(`lista_exercicios.${index}.nome`)} placeholder={g.exemplo} className="input-base" />
                          {errEx?.nome && <p className="form-error">{errEx.nome.message}</p>}
                        </div>
                        <div>
                          <label className="form-label text-xs">Séries</label>
                          <input {...register(`lista_exercicios.${index}.series`, { valueAsNumber: true })}
                            type="number" min={1} max={20} className="input-base" />
                        </div>
                        <div>
                          <label className="form-label text-xs">{g.repsLabel}</label>
                          <input {...register(`lista_exercicios.${index}.reps`)} placeholder={g.repsPlaceholder} className="input-base" />
                          {errEx?.reps && <p className="form-error">{errEx.reps.message}</p>}
                        </div>
                        {g.id === 'treino' && (
                          <div>
                            <label className="form-label text-xs">Carga sugerida</label>
                            <input {...register(`lista_exercicios.${index}.carga`)} placeholder="Ex: 60kg" className="input-base" />
                          </div>
                        )}
                        <div className={g.id === 'treino' ? '' : 'col-span-2'}>
                          <label className="form-label text-xs">Observações</label>
                          <input {...register(`lista_exercicios.${index}.observacoes`)}
                            placeholder={g.id === 'treino' ? 'Ex: Pausa 90s' : 'Ex: cada lado, sem pressa'} className="input-base" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
