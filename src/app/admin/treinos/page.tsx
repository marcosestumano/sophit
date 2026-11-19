'use client'

import { useState, useEffect } from 'react'
import { dateKey } from '@/lib/dates'
import Link from 'next/link'
import { mesKey, normalizaMes, nomeMesAno } from '@/lib/periodizacao'
import { useForm } from 'react-hook-form'
import { BlocosEditor } from '@/components/admin/BlocosEditor'
import { blocosPadrao, blocosParaLista, listaParaBlocos } from '@/lib/secoes'
import { zodResolver } from '@hookform/resolvers/zod'
import { treinoSchema, type TreinoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Dumbbell, Loader2, CheckCircle2,
  GripVertical, ChevronDown, ChevronUp, BookOpen,
  Copy, Save, ChevronRight,
} from 'lucide-react'
import type { Profile } from '@/types'

interface Template {
  id: string
  titulo: string
  descricao: string | null
  lista_exercicios: any[]
  categoria: string | null
}

export default function GestorTreinosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateCategoria, setTemplateCategoria] = useState('')
  const [alunoOrigem, setAlunoOrigem] = useState<string | null>(null)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    // Vindo do plano anual do aluno: /admin/treinos?aluno=<id>&mes=2026-12
    const params = new URLSearchParams(window.location.search)
    const aluno = params.get('aluno')
    const mes = params.get('mes')
    if (mes && /^\d{4}-\d{2}$/.test(mes)) setValue('mes_referencia', mes)
    supabase.from('profiles').select('*').eq('role', 'user').order('full_name')
      .then(({ data }) => {
        setUsers(data ?? [])
        if (aluno && data?.some(u => u.id === aluno)) {
          setAlunoOrigem(aluno)
          // espera o <select> renderizar as opções antes de marcar o aluno
          requestAnimationFrame(() => setValue('user_id', aluno))
        }
      })
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('treino_templates')
      .select('*')
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
  }

  const { register, handleSubmit, control, reset, setValue, getValues, formState: { errors } } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      blocos: blocosPadrao(),
      data_atribuicao: dateKey(),
      mes_referencia: mesKey().slice(0, 7),
    },
  })


  function loadTemplate(template: Template) {
    setValue('titulo', template.titulo)
    setValue('descricao', template.descricao ?? '')
    setValue('blocos', listaParaBlocos(template.lista_exercicios))
    setEditorKey(k => k + 1)
    setShowTemplates(false)
  }

  async function deleteTemplate(id: string) {
    await supabase.from('treino_templates').delete().eq('id', id)
    fetchTemplates()
  }

  async function onSubmit(data: TreinoFormData) {
    setLoading(true)
    setErro(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setErro('Sua sessão expirou. Entre de novo para salvar o treino.')
      return
    }

    // Salva o treino
    // Ordem: entra no fim dos treinos daquele mês
    const mesRef = normalizaMes(data.mes_referencia)!
    const { count } = await supabase.from('treinos').select('id', { count: 'exact', head: true })
      .eq('user_id', data.user_id).eq('mes_referencia', mesRef)

    const lista = blocosParaLista(data.blocos)
    const { error } = await supabase.from('treinos').insert({
      user_id: data.user_id,
      titulo: data.titulo,
      descricao: data.descricao,
      data_atribuicao: data.data_atribuicao,
      lista_exercicios: lista,
      mes_referencia: mesRef,
      ordem: count ?? null,
      admin_id: user.id,
    })

    // Salva como template se marcado
    if (!error && saveAsTemplate) {
      await supabase.from('treino_templates').insert({
        admin_id: user!.id,
        titulo: data.titulo,
        descricao: data.descricao,
        lista_exercicios: lista,
        categoria: templateCategoria || null,
      })
      fetchTemplates()
    }

    setLoading(false)
    if (error) {
      console.error('Erro ao atribuir treino:', error)
      setErro(error.message.includes('mes_referencia')
        ? 'A coluna "mes_referencia" não existe no banco. Rode a migration 004_treinos_mensais.sql no Supabase.'
        : `Não foi possível salvar o treino: ${error.message}`)
      return
    }
    {
      router.refresh()
      setSaved(true)
      // Mantém aluno e mês para montar o próximo treino (A, B, C...) do mesmo plano
      reset({
        user_id: data.user_id,
        mes_referencia: data.mes_referencia,
        blocos: blocosPadrao(),
        data_atribuicao: dateKey(),
      })
      setEditorKey(k => k + 1)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px] leading-tight font-normal text-foreground">
          Gestor de Treinos
        </h1>
        <p className="text-muted-foreground mt-1">Crie, reutilize e atribua treinos personalizados</p>
        {alunoOrigem && (
          <Link href={`/admin/usuarios/${alunoOrigem}`} className="inline-flex items-center gap-1 text-sm font-medium mt-2" style={{ color: 'var(--rose-text)' }}>
            ← Voltar para o plano anual do aluno
          </Link>
        )}
      </div>

      {/* Biblioteca de Templates */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: '#e8799f' }} />
            <span className="font-medium text-foreground">Biblioteca de Treinos</span>
            {templates.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/30  font-medium">
                {templates.length} salvos
              </span>
            )}
          </div>
          {showTemplates
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showTemplates && (
          <div className="border-t border-border p-4 animate-slide-up">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum template salvo ainda. Crie um treino marcando "Salvar na biblioteca".
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground">{t.titulo}</p>
                        {t.categoria && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t.categoria}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.lista_exercicios.length} exercícios · {listaParaBlocos(t.lista_exercicios).length} bloco{listaParaBlocos(t.lista_exercicios).length !== 1 ? 's' : ''}
                        {t.descricao && ` · ${t.descricao}`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => loadTemplate(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Usar
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-normal text-foreground">Informações do Treino</h2>

          <div>
            <label className="form-label">Atribuir para</label>
            <select {...register('user_id')} className="input-base">
              <option value="">Selecione um aluno...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
              ))}
            </select>
            {errors.user_id && <p className="form-error">{errors.user_id.message}</p>}
          </div>

          <div>
            <label className="form-label">Título do Treino</label>
            <input {...register('titulo')} placeholder="Ex: Treino A — Peito e Tríceps" className="input-base" />
            {errors.titulo && <p className="form-error">{errors.titulo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Mês do plano</label>
              <input {...register('mes_referencia')} type="month" className="input-base" />
              {errors.mes_referencia
                ? <p className="form-error">{errors.mes_referencia.message}</p>
                : <p className="text-xs text-muted-foreground mt-1">O aluno vê este treino durante o mês escolhido.</p>}
            </div>
            <div>
              <label className="form-label">Data de atribuição</label>
              <input {...register('data_atribuicao')} type="date" className="input-base" />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
            <textarea {...register('descricao')} rows={2} placeholder="Instruções gerais, foco do treino..." className="input-base resize-none" />
          </div>

          {/* Opção de salvar como template */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${saveAsTemplate ? 'bg-brand-500' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${saveAsTemplate ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Salvar na biblioteca</p>
                <p className="text-xs text-muted-foreground">Permite reutilizar este treino para outros alunos</p>
              </div>
            </label>
            {saveAsTemplate && (
              <div className="mt-3">
                <label className="form-label text-xs">Categoria <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <input
                  value={templateCategoria}
                  onChange={e => setTemplateCategoria(e.target.value)}
                  placeholder="Ex: Hipertrofia, Emagrecimento, Funcional..."
                  className="input-base"
                />
              </div>
            )}
          </div>
        </div>

        {/* Exercícios em blocos: Mobilidade → Ativação → Treino */}
        <div className="card p-6">
          <h2 className="font-normal text-foreground mb-1">Montagem do treino</h2>
          <p className="text-sm text-muted-foreground mb-4">Organize em blocos (ex: Mobilidade, Ativação, Superiores, Core). Renomeie, reordene e crie quantos precisar.</p>
          <BlocosEditor key={editorKey} control={control} register={register} errors={errors} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary gap-2">
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : saved
              ? <CheckCircle2 className="h-4 w-4" />
              : <Save className="h-4 w-4" />}
            {saved ? 'Treino criado!' : 'Criar e Atribuir Treino'}
          </button>
          {erro && (
            <p role="alert" className="text-sm text-destructive">{erro}</p>
          )}
          {saved && (
            <span className="text-sm text-dieta flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {saveAsTemplate ? 'Salvo na biblioteca!' : ''}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
