'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BlocosEditor } from '@/components/admin/BlocosEditor'
import { blocosPadrao, blocosParaLista, listaParaBlocos, type ExercicioSalvo } from '@/lib/secoes'
import { zodResolver } from '@hookform/resolvers/zod'
import { treinoSchema, type TreinoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { mesDoTreino, mesKey, normalizaMes } from '@/lib/periodizacao'
import { notificarTreino } from '@/lib/push'
import {
  X,
  Loader2, CheckCircle2, Save,
} from 'lucide-react'

interface Treino {
  id: string; titulo: string; descricao: string | null
  lista_exercicios: ExercicioSalvo[]; data_atribuicao: string; ativo: boolean; user_id: string
  mes_referencia?: string | null
}
interface Props { treino: Treino; onClose: () => void }

export function EditTreinoModal({ treino, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { register, handleSubmit, control, getValues, setValue, formState: { errors } } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      user_id: treino.user_id,
      titulo: treino.titulo,
      descricao: treino.descricao ?? '',
      blocos: treino.lista_exercicios?.length
        ? listaParaBlocos(treino.lista_exercicios)
        : blocosPadrao(),
      data_atribuicao: treino.data_atribuicao,
      mes_referencia: mesDoTreino(treino).slice(0, 7),
    },
  })

  // ── Submit ────────────────────────────────────────────────
  async function onSubmit(data: TreinoFormData) {
    setLoading(true)
    const { error } = await supabase.from('treinos').update({
      titulo: data.titulo,
      descricao: data.descricao,
      lista_exercicios: blocosParaLista(data.blocos),
      data_atribuicao: data.data_atribuicao,
      mes_referencia: normalizaMes(data.mes_referencia),
    }).eq('id', treino.id)
    setLoading(false)
    if (error) {
      setErro(error.message.includes('mes_referencia')
        ? 'A coluna "mes_referencia" não existe no banco. Rode a migration 004_treinos_mensais.sql no Supabase.'
        : `Não foi possível salvar: ${error.message}`)
      return
    }
    const mesNovo = normalizaMes(data.mes_referencia)
    if (treino.ativo && (!mesNovo || mesNovo <= mesKey())) {
      notificarTreino({ userId: treino.user_id, tipo: 'editado', titulo: data.titulo, treinoId: treino.id })
    }
    setErro(null); setSaved(true); router.refresh(); setTimeout(() => { setSaved(false); onClose() }, 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(44,35,37,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-2xl my-4 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-normal text-foreground text-lg">Editar Treino</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Info básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Título do treino</label>
                <input {...register('titulo')} className="input-base" placeholder="Ex: Treino A — Peito" />
                {errors.titulo && <p className="form-error">{errors.titulo.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Data de atribuição</label>
                <input {...register('data_atribuicao')} type="date" className="input-base" />
              </div>
            </div>

            <div>
              <label className="form-label">Mês do plano</label>
              <input {...register('mes_referencia')} type="month" className="input-base" />
              {errors.mes_referencia && <p className="form-error">{errors.mes_referencia.message}</p>}
            </div>

            <div>
              <label className="form-label">Descrição <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <textarea {...register('descricao')} rows={2} className="input-base resize-none" placeholder="Orientações gerais..." />
            </div>

            {/* Exercícios em blocos: Mobilidade → Ativação → Treino */}
            <div>
              <label className="form-label">Montagem do treino</label>
              <BlocosEditor control={control} register={register} errors={errors} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            {erro && <p role="alert" className="flex-1 text-sm text-destructive">{erro}</p>}
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved ? <CheckCircle2 className="h-4 w-4" />
                : <Save className="h-4 w-4" />}
              {saved ? 'Salvo!' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
