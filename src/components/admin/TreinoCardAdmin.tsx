'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Target, Pencil } from 'lucide-react'
import { DeleteTreinoButton } from '@/components/admin/DeleteTreinoButton'
import { EditTreinoModal } from '@/components/admin/EditTreinoModal'
import { ProgressaoAdmin } from '@/components/admin/ProgressaoAdmin'
import { PreparoAdmin } from '@/components/admin/PreparoAdmin'
import type { Exercicio } from '@/types'
import { agruparBlocos, numeroBloco, registraCarga } from '@/lib/secoes'

interface Treino {
  id: string
  titulo: string
  descricao: string | null
  lista_exercicios: Exercicio[]
  data_atribuicao: string
  ativo: boolean
  user_id: string
}

export function TreinoCardAdmin({ treino, userId }: { treino: Treino; userId: string }) {
  const [editing, setEditing] = useState(false)
  const exercicios: Exercicio[] = treino.lista_exercicios ?? []

  return (
    <>
      {editing && (
        <EditTreinoModal treino={treino} onClose={() => setEditing(false)} />
      )}

      <div>
        {/* Header do treino */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground">{treino.titulo}</h3>
              <span className={treino.ativo
                ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 '
                : 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground'
              }>
                {treino.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {treino.descricao && (
              <p className="text-sm text-muted-foreground mt-0.5">{treino.descricao}</p>
            )}
            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(treino.data_atribuicao), 'dd/MM/yyyy')}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                {exercicios.length} exercícios
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <DeleteTreinoButton treinoId={treino.id} titulo={treino.titulo} />
          </div>
        </div>

        {/* Lista resumida de exercícios, por bloco */}
        <div className="space-y-3 mb-2">
          {agruparBlocos(exercicios).map((g, gi) => (
            <div key={g.id}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                <span className="font-semibold tabular-nums" style={{ color: 'var(--rose-text)' }}>{numeroBloco(gi)}</span>{' '}
                <span className="text-foreground">{g.titulo}</span>
                {g.tipo === 'preparo' && <span className="font-normal"> · só marcar feito</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {g.itens.map(({ item: ex }, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
                    <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: 'rgba(232,121,159,0.15)', color: 'var(--rose-text)' }}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground truncate">{ex.nome}</span>
                    <span className="text-muted-foreground ml-auto flex-shrink-0">
                      {ex.series}×{ex.reps}
                      {ex.carga ? ` · ${ex.carga}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobilidade/ativação marcadas pelo aluno */}
        <PreparoAdmin userId={userId} treinoId={treino.id} exercicios={exercicios} />

        {/* Progressão de cargas */}
        <ProgressaoAdmin
          userId={userId}
          treinoId={treino.id}
          treinoTitulo={treino.titulo}
          exercicios={exercicios.filter(registraCarga)}
        />
      </div>
    </>
  )
}
