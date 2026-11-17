'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HeartPulse, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, Field } from '@/components/app/Sheet'
import { TIPOS_CARDIO, INTENSIDADES } from './RegistroCardioSheet'
import { dateKey, parseKey } from '@/lib/dates'
import type { CardioPrescricao, CardioRegistro } from '@/types'

export function CardioAdmin({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [prescricoes, setPrescricoes] = useState<CardioPrescricao[]>([])
  const [registros, setRegistros] = useState<CardioRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [edit, setEdit] = useState<CardioPrescricao | null | undefined>(undefined)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [p, r] = await Promise.all([
      supabase.from('cardio_prescricoes').select('*').eq('user_id', userId).eq('ativo', true).order('created_at'),
      supabase.from('cardio_registros').select('*').eq('user_id', userId).gte('data', dateKey(subDays(new Date(), 14))).order('data', { ascending: false }),
    ])
    const e = p.error ?? r.error
    setErro(e ? (e.message.includes('cardio_') ? 'Rode a migration 003_dieta_cardio.sql no Supabase.' : 'Erro ao carregar cardio.') : null)
    setPrescricoes((p.data ?? []) as CardioPrescricao[])
    setRegistros((r.data ?? []) as CardioRegistro[])
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => { carregar() }, [carregar])

  async function excluir(p: CardioPrescricao) {
    if (!confirm(`Remover a prescrição "${p.tipo}"?`)) return
    // Desativa para manter o histórico de registros ligado a ela
    await supabase.from('cardio_prescricoes').update({ ativo: false }).eq('id', p.id)
    carregar()
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-normal text-foreground flex items-center gap-2"><HeartPulse className="h-4 w-4 text-brand-500" /> Cardio</h2>
        <button onClick={() => setEdit(null)} disabled={!!erro} className="btn-secondary text-xs px-3 py-1.5"><Plus className="h-3.5 w-3.5" /> Prescrever</button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-500" /> : erro ? <p className="text-sm text-destructive">{erro}</p> : (
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Prescrito</p>
            {prescricoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cardio prescrito.</p>}
            <div className="space-y-2">
              {prescricoes.map(p => (
                <div key={p.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{p.tipo}</p>
                    <p className="text-xs text-muted-foreground">{[p.duracao_min && `${p.duracao_min} min`, p.frequencia_semana && `${p.frequencia_semana}x/semana`, p.intensidade].filter(Boolean).join(' · ')}</p>
                    {p.observacoes && <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>}
                  </div>
                  <button onClick={() => setEdit(p)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => excluir(p)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Feitos (últimos 14 dias)</p>
            {registros.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
            <div className="space-y-1.5">
              {registros.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-muted-foreground w-16">{format(parseKey(r.data), 'EEE dd', { locale: ptBR })}</span>
                  <span className="flex-1 font-medium text-foreground truncate">{r.tipo}</span>
                  <span className="text-muted-foreground">{r.duracao_min ? `${r.duracao_min} min` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PrescricaoSheet open={edit !== undefined} onClose={() => setEdit(undefined)} presc={edit ?? null}
        onSave={async (v) => {
          const { error } = edit
            ? await supabase.from('cardio_prescricoes').update(v).eq('id', edit.id)
            : await supabase.from('cardio_prescricoes').insert({ ...v, user_id: userId })
          if (error) throw error
          await carregar()
        }} />
    </div>
  )
}

function PrescricaoSheet({ open, onClose, presc, onSave }: {
  open: boolean; onClose: () => void; presc: CardioPrescricao | null
  onSave: (v: Pick<CardioPrescricao, 'tipo' | 'duracao_min' | 'frequencia_semana' | 'intensidade' | 'observacoes'>) => Promise<void>
}) {
  const [tipo, setTipo] = useState('')
  const [dur, setDur] = useState('')
  const [freq, setFreq] = useState('')
  const [int, setInt] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErro(null)
    setTipo(presc?.tipo ?? ''); setDur(presc?.duracao_min ? String(presc.duracao_min) : '')
    setFreq(presc?.frequencia_semana ? String(presc.frequencia_semana) : ''); setInt(presc?.intensidade ?? ''); setObs(presc?.observacoes ?? '')
  }, [open, presc])

  async function salvar() {
    if (!tipo.trim()) { setErro('Informe o tipo'); return }
    setSaving(true)
    try {
      await onSave({ tipo: tipo.trim(), duracao_min: dur ? Number(dur) : null, frequencia_semana: freq ? Number(freq) : null, intensidade: int || null, observacoes: obs || null })
      onClose()
    } catch (e: any) { setErro(e?.message ?? 'Erro ao salvar') } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={presc ? 'Editar cardio' : 'Prescrever cardio'}
      footer={<button onClick={salvar} disabled={saving} className="btn-primary w-full py-2.5">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar</button>}>
      <div className="space-y-3">
        <Field label="Tipo">
          <input className="input-base" list="tipos-cardio" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Esteira" />
          <datalist id="tipos-cardio">{TIPOS_CARDIO.map(t => <option key={t} value={t} />)}</datalist>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Duração (min)"><input className="input-base" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
          <Field label="Vezes/semana"><input className="input-base" inputMode="numeric" value={freq} onChange={e => setFreq(e.target.value)} /></Field>
          <Field label="Intensidade">
            <select className="input-base" value={int} onChange={e => setInt(e.target.value)}>
              <option value="">—</option>{INTENSIDADES.map(i => <option key={i}>{i}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observações"><textarea className="input-base min-h-[60px]" value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: em jejum, inclinação 8%" /></Field>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Sheet>
  )
}
