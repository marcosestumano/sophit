'use client'

import { useRef, useState } from 'react'
import {
  useController, useFieldArray, useWatch,
  type Control, type UseFormRegister, type FieldErrors,
} from 'react-hook-form'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Dumbbell, CheckSquare } from 'lucide-react'
import type { TreinoFormData } from '@/lib/validations'
import { novoBloco, novoExercicio, numeroBloco, SUGESTOES_BLOCO, type TipoBloco } from '@/lib/secoes'
import { cn } from '@/lib/utils'

interface Props {
  control: Control<TreinoFormData>
  register: UseFormRegister<TreinoFormData>
  errors: FieldErrors<TreinoFormData>
}

/**
 * Montagem do treino em blocos livres: título editável, quantos blocos forem necessários,
 * cada um "com carga" (o aluno registra carga) ou "só marcar feito" (mobilidade, ativação...).
 */
export function BlocosEditor({ control, register, errors }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'blocos', keyName: 'key' })
  const [criando, setCriando] = useState(false)
  const [tituloNovo, setTituloNovo] = useState('')

  const erroLista = (errors.blocos as any)?.root?.message ?? (errors.blocos as any)?.message

  function criar(titulo: string, tipo: TipoBloco) {
    const t = titulo.trim()
    if (!t) return
    append(novoBloco(t, tipo))
    setTituloNovo('')
    setCriando(false)
  }

  return (
    <div className="space-y-3">
      {erroLista && <p role="alert" className="form-error">{erroLista}</p>}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 rounded-xl border border-dashed border-border">
          Nenhum bloco ainda. Crie o primeiro abaixo.
        </p>
      )}

      {fields.map((f, bi) => (
        <BlocoEditor key={f.key} control={control} register={register} errors={errors}
          bi={bi} total={fields.length}
          onRemove={() => remove(bi)}
          onMove={to => move(bi, to)} />
      ))}

      {/* Novo bloco */}
      {criando ? (
        <div className="rounded-xl border border-border p-4 space-y-3 animate-slide-up">
          <div className="flex gap-2">
            <input autoFocus value={tituloNovo} onChange={e => setTituloNovo(e.target.value)} maxLength={40}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar(tituloNovo, 'carga') } }}
              placeholder="Título do bloco. Ex: Superiores, Core, Finalizador" className="input-base flex-1" />
            <button type="button" onClick={() => criar(tituloNovo, 'carga')} disabled={!tituloNovo.trim()} className="btn-primary text-xs">
              Criar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Sugestões:</span>
            {SUGESTOES_BLOCO.map(s => (
              <button key={s.titulo} type="button" onClick={() => criar(s.titulo, s.tipo)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted text-foreground">
                {s.titulo}
              </button>
            ))}
            <button type="button" onClick={() => { setCriando(false); setTituloNovo('') }}
              className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground ml-auto">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setCriando(true)}
          className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar bloco
        </button>
      )}
    </div>
  )
}

function BlocoEditor({ control, register, errors, bi, total, onRemove, onMove }: Props & {
  bi: number; total: number; onRemove: () => void; onMove: (to: number) => void
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: `blocos.${bi}.exercicios` })
  const { field: tipoField } = useController({ control, name: `blocos.${bi}.tipo` })
  const valores = useWatch({ control, name: `blocos.${bi}.exercicios` }) ?? []
  const tipo = tipoField.value as TipoBloco
  const [aberto, setAberto] = useState<string | null>(null)

  const dragFrom = useRef<number | null>(null)
  const dragTo = useRef<number | null>(null)
  const [dragActive, setDragActive] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function onDragEnd() {
    const from = dragFrom.current, to = dragTo.current
    if (from !== null && to !== null && from !== to) move(from, to)
    dragFrom.current = null; dragTo.current = null
    setDragActive(null); setDragOver(null)
  }

  function adicionar() {
    append(novoExercicio(tipo))
    setAberto(`novo-${fields.length}`)
  }

  const errBloco = errors.blocos?.[bi]

  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <header className="px-3 py-3 bg-muted/40 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 w-10 text-sm font-semibold tabular-nums tracking-[-0.02em]" style={{ color: 'var(--rose-text)' }}
            aria-label={`Bloco ${bi + 1}`}>{numeroBloco(bi)}</span>
          <input {...register(`blocos.${bi}.titulo`)} maxLength={40} aria-label={`Título do bloco ${bi + 1}`}
            placeholder="Título do bloco"
            className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground rounded-md px-2 py-1.5 border border-transparent hover:border-border focus:border-brand-500 focus:bg-card outline-none" />
          <button type="button" onClick={() => onMove(bi - 1)} disabled={bi === 0} aria-label="Subir bloco"
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => onMove(bi + 1)} disabled={bi === total - 1} aria-label="Descer bloco"
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onRemove} aria-label="Excluir bloco"
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        {errBloco?.titulo && <p className="form-error">{errBloco.titulo.message}</p>}
        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-12">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-card" role="radiogroup" aria-label="Tipo do bloco">
            {([['carga', 'Registra carga', Dumbbell], ['preparo', 'Só marcar feito', CheckSquare]] as const).map(([v, label, Icon]) => (
              <button key={v} type="button" role="radio" aria-checked={tipo === v} onClick={() => tipoField.onChange(v)}
                className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors',
                  tipo === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {tipo === 'carga' ? 'O aluno registra a carga de cada exercício.' : 'O aluno toca para marcar como feito.'}
          </span>
        </div>
      </header>

      <div className="p-3 space-y-2">
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Bloco vazio (blocos sem exercício não são salvos).</p>
        )}

        {fields.map((field, index) => {
          const id = field.id
          const expandido = aberto === id || aberto === `novo-${index}`
          const v = valores[index]
          const isOver = dragOver === index && dragActive !== null && dragActive !== index
          const errEx = errBloco?.exercicios?.[index]

          return (
            <div key={id}
              draggable={!expandido}
              onDragStart={e => { e.stopPropagation(); dragFrom.current = index; setDragActive(index) }}
              onDragEnter={() => { if (dragFrom.current !== null) { dragTo.current = index; setDragOver(index) } }}
              onDragOver={e => e.preventDefault()}
              onDragEnd={onDragEnd}
              className={cn('border rounded-lg overflow-hidden transition-all duration-150',
                isOver ? 'border-brand-500 bg-brand-500/5' : 'border-border',
                errEx && !expandido && 'border-destructive')}
              style={{ opacity: dragActive === index ? 0.4 : 1 }}
            >
              <div className="flex items-center gap-2 p-3 bg-muted/20">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" aria-hidden="true" />
                <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ background: 'rgba(232,121,159,0.15)', color: 'var(--rose-text)' }}>
                  {index + 1}
                </span>
                <button type="button" onClick={() => setAberto(expandido ? null : id)}
                  className="flex-1 min-w-0 text-left text-sm font-medium text-foreground truncate">
                  {v?.nome || `Exercício ${index + 1}`}
                  {!expandido && v && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {v.series}×{v.reps}{tipo === 'carga' && v.carga ? ` · ${v.carga}` : ''}
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
                    <input {...register(`blocos.${bi}.exercicios.${index}.nome`)}
                      placeholder={tipo === 'carga' ? 'Ex: Supino reto com barra' : 'Ex: Mobilidade de quadril 90/90'} className="input-base" />
                    {errEx?.nome && <p className="form-error">{errEx.nome.message}</p>}
                  </div>
                  <div>
                    <label className="form-label text-xs">Séries</label>
                    <input {...register(`blocos.${bi}.exercicios.${index}.series`, { valueAsNumber: true })}
                      type="number" min={1} max={20} className="input-base" />
                    {errEx?.series && <p className="form-error">{errEx.series.message}</p>}
                  </div>
                  <div>
                    <label className="form-label text-xs">{tipo === 'carga' ? 'Repetições' : 'Reps / tempo'}</label>
                    <input {...register(`blocos.${bi}.exercicios.${index}.reps`)}
                      placeholder={tipo === 'carga' ? 'Ex: 10-12' : 'Ex: 10 ou 30s'} className="input-base" />
                    {errEx?.reps && <p className="form-error">{errEx.reps.message}</p>}
                  </div>
                  {tipo === 'carga' && (
                    <div>
                      <label className="form-label text-xs">Carga sugerida</label>
                      <input {...register(`blocos.${bi}.exercicios.${index}.carga`)} placeholder="Ex: 60kg" className="input-base" />
                    </div>
                  )}
                  <div className={tipo === 'carga' ? '' : 'col-span-2'}>
                    <label className="form-label text-xs">Observações</label>
                    <input {...register(`blocos.${bi}.exercicios.${index}.observacoes`)}
                      placeholder={tipo === 'carga' ? 'Ex: Pausa 90s' : 'Ex: cada lado, sem pressa'} className="input-base" />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button type="button" onClick={adicionar} className="btn-secondary text-xs gap-1 w-full">
          <Plus className="h-3.5 w-3.5" /> Adicionar exercício
        </button>
      </div>
    </section>
  )
}
