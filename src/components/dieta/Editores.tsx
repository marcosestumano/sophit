'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Sheet, Field } from '@/components/app/Sheet'
import { macrosAlimentos, round } from '@/lib/dieta'
import type { Alimento, DietaPlano, DietaRefeicao } from '@/types'
import type { PlanoInput, RefeicaoInput } from './useDieta'

const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')))
const str = (v: number | null | undefined) => (v == null ? '' : String(v))

// ── Plano alimentar ────────────────────────────────────────────
export function PlanoEditor({ open, onClose, plano, onSave }: {
  open: boolean; onClose: () => void; plano: DietaPlano | null; onSave: (p: PlanoInput) => Promise<void>
}) {
  const [f, setF] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErro(null)
    setF({
      titulo: plano?.titulo ?? 'Plano alimentar',
      meta_kcal: str(plano?.meta_kcal), meta_proteina: str(plano?.meta_proteina),
      meta_carbo: str(plano?.meta_carbo), meta_gordura: str(plano?.meta_gordura),
      agua_litros: str(plano?.agua_litros), dias_semana: plano?.dias_semana ?? 'Todos os dias',
      prescricao: plano?.prescricao ?? '', observacoes: plano?.observacoes ?? '', refeicao_livre: plano?.refeicao_livre ?? '',
    })
  }, [open, plano])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }))

  async function salvar() {
    if (!f.titulo?.trim()) { setErro('Informe um título'); return }
    setSaving(true)
    try {
      await onSave({
        titulo: f.titulo.trim(),
        meta_kcal: num(f.meta_kcal), meta_proteina: num(f.meta_proteina), meta_carbo: num(f.meta_carbo), meta_gordura: num(f.meta_gordura),
        agua_litros: num(f.agua_litros), dias_semana: f.dias_semana || 'Todos os dias',
        prescricao: f.prescricao || null, observacoes: f.observacoes || null, refeicao_livre: f.refeicao_livre || null,
      })
      onClose()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={plano ? 'Editar plano alimentar' : 'Novo plano alimentar'}
      footer={<button onClick={salvar} disabled={saving} className="btn-primary w-full py-3 rounded-xl">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar plano</button>}>
      <div className="space-y-3">
        <Field label="Título"><input className="input-base" value={f.titulo ?? ''} onChange={set('titulo')} placeholder="Plano Alimentar Base" /></Field>
        <p className="text-xs text-muted-foreground pt-1">Metas diárias (deixe em branco para usar a soma das refeições)</p>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Kcal"><input className="input-base" inputMode="numeric" value={f.meta_kcal ?? ''} onChange={set('meta_kcal')} /></Field>
          <Field label="Prot. (g)"><input className="input-base" inputMode="numeric" value={f.meta_proteina ?? ''} onChange={set('meta_proteina')} /></Field>
          <Field label="Carbo (g)"><input className="input-base" inputMode="numeric" value={f.meta_carbo ?? ''} onChange={set('meta_carbo')} /></Field>
          <Field label="Gord. (g)"><input className="input-base" inputMode="numeric" value={f.meta_gordura ?? ''} onChange={set('meta_gordura')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Água (litros/dia)"><input className="input-base" inputMode="decimal" value={f.agua_litros ?? ''} onChange={set('agua_litros')} placeholder="3" /></Field>
          <Field label="Dias da semana"><input className="input-base" value={f.dias_semana ?? ''} onChange={set('dias_semana')} /></Field>
        </div>
        <Field label="Prescrição / suplementação"><textarea className="input-base min-h-[64px]" value={f.prescricao ?? ''} onChange={set('prescricao')} placeholder="Creatina 5g ao dia." /></Field>
        <Field label="Observações"><textarea className="input-base min-h-[64px]" value={f.observacoes ?? ''} onChange={set('observacoes')} /></Field>
        <Field label="Refeição livre"><textarea className="input-base min-h-[64px]" value={f.refeicao_livre ?? ''} onChange={set('refeicao_livre')} placeholder="Liberada uma refeição livre por semana..." /></Field>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Sheet>
  )
}

// ── Refeição ───────────────────────────────────────────────────
type AlimentoForm = { nome: string; quantidade: string; kcal: string; proteina: string; carbo: string; gordura: string }
const vazio = (): AlimentoForm => ({ nome: '', quantidade: '', kcal: '', proteina: '', carbo: '', gordura: '' })

export function RefeicaoEditor({ open, onClose, refeicao, onSave }: {
  open: boolean; onClose: () => void; refeicao: DietaRefeicao | null; onSave: (r: RefeicaoInput) => Promise<void>
}) {
  const [nome, setNome] = useState('')
  const [horario, setHorario] = useState('')
  const [obs, setObs] = useState('')
  const [alimentos, setAlimentos] = useState<AlimentoForm[]>([vazio()])
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErro(null)
    setNome(refeicao?.nome ?? '')
    setHorario(refeicao?.horario ?? '')
    setObs(refeicao?.observacoes ?? '')
    setAlimentos(refeicao?.alimentos?.length
      ? refeicao.alimentos.map(a => ({ nome: a.nome ?? '', quantidade: a.quantidade ?? '', kcal: str(a.kcal), proteina: str(a.proteina), carbo: str(a.carbo), gordura: str(a.gordura) }))
      : [vazio()])
  }, [open, refeicao])

  const parsed: Alimento[] = alimentos.filter(a => a.nome.trim()).map(a => ({
    nome: a.nome.trim(), quantidade: a.quantidade.trim() || undefined,
    kcal: num(a.kcal) ?? undefined, proteina: num(a.proteina) ?? undefined, carbo: num(a.carbo) ?? undefined, gordura: num(a.gordura) ?? undefined,
  }))
  const tot = macrosAlimentos(parsed)

  function upd(i: number, k: keyof AlimentoForm, v: string) {
    setAlimentos(list => list.map((a, j) => j === i ? { ...a, [k]: v } : a))
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Dê um nome para a refeição'); return }
    setSaving(true)
    try {
      await onSave({ id: refeicao?.id, nome: nome.trim(), horario: horario || null, alimentos: parsed, observacoes: obs || null })
      onClose()
    } catch (e: any) { setErro(e?.message ?? 'Erro ao salvar') } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={refeicao ? 'Editar refeição' : 'Nova refeição'}
      footer={
        <div className="flex items-center gap-3">
          <p className="flex-1 text-xs text-muted-foreground">
            <b className="text-foreground">{round(tot.kcal)} kcal</b> · {round(tot.proteina)}g P · {round(tot.carbo)}g C · {round(tot.gordura)}g G
          </p>
          <button onClick={salvar} disabled={saving} className="btn-primary py-2.5 px-5 rounded-xl">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar</button>
        </div>
      }>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Nome" className="col-span-2"><input className="input-base" value={nome} onChange={e => setNome(e.target.value)} placeholder="Café da manhã" /></Field>
          <Field label="Horário"><input type="time" className="input-base" value={horario} onChange={e => setHorario(e.target.value)} /></Field>
        </div>

        <p className="text-sm font-semibold text-foreground pt-2">Alimentos</p>
        {alimentos.map((a, i) => (
          <div key={i} className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex gap-2">
              <input className="input-base flex-1" value={a.nome} onChange={e => upd(i, 'nome', e.target.value)} placeholder="Alimento (ex: Ovo)" />
              <input className="input-base w-28" value={a.quantidade} onChange={e => upd(i, 'quantidade', e.target.value)} placeholder="Qtd (2 un)" />
              <button type="button" onClick={() => setAlimentos(l => l.length > 1 ? l.filter((_, j) => j !== i) : [vazio()])}
                className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover alimento"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['kcal', 'proteina', 'carbo', 'gordura'] as const).map(k => (
                <input key={k} className="input-base text-xs" inputMode="decimal" value={a[k]} onChange={e => upd(i, k, e.target.value)}
                  placeholder={{ kcal: 'kcal', proteina: 'P (g)', carbo: 'C (g)', gordura: 'G (g)' }[k]} />
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setAlimentos(l => [...l, vazio()])} className="btn-secondary w-full rounded-xl">
          <Plus className="h-4 w-4" /> Adicionar alimento
        </button>
        <Field label="Observações"><textarea className="input-base min-h-[60px]" value={obs} onChange={e => setObs(e.target.value)} /></Field>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Sheet>
  )
}
