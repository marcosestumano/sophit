'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Sheet, Field } from '@/components/app/Sheet'
import type { CardioPrescricao } from '@/types'
import { cn } from '@/lib/utils'

export const TIPOS_CARDIO = ['Esteira', 'Bike', 'Elíptico', 'Escada', 'Caminhada', 'Corrida', 'Natação', 'Pular corda']
export const INTENSIDADES = ['Leve', 'Moderada', 'Intensa', 'HIIT']

export interface RegistroInput {
  data: string; tipo: string; prescricao_id: string | null
  duracao_min: number | null; distancia_km: number | null; calorias: number | null
  intensidade: string | null; observacoes: string | null
}

const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')))

export function RegistroCardioSheet({ open, onClose, data, prescricoes, onSave }: {
  open: boolean; onClose: () => void; data: string; prescricoes: CardioPrescricao[]; onSave: (r: RegistroInput) => Promise<void>
}) {
  const [tipo, setTipo] = useState('')
  const [prescId, setPrescId] = useState<string | null>(null)
  const [dia, setDia] = useState(data)
  const [dur, setDur] = useState('')
  const [dist, setDist] = useState('')
  const [cal, setCal] = useState('')
  const [int, setInt] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const p = prescricoes[0]
    setDia(data); setErro(null); setObs(''); setDist(''); setCal('')
    setTipo(p?.tipo ?? ''); setPrescId(p?.id ?? null)
    setDur(p?.duracao_min ? String(p.duracao_min) : ''); setInt(p?.intensidade ?? '')
  }, [open, data, prescricoes])

  function escolherPresc(p: CardioPrescricao) {
    setPrescId(p.id); setTipo(p.tipo)
    if (p.duracao_min) setDur(String(p.duracao_min))
    if (p.intensidade) setInt(p.intensidade)
  }

  async function salvar() {
    if (!tipo.trim()) { setErro('Escolha o tipo de cardio'); return }
    setSaving(true)
    try {
      await onSave({ data: dia, tipo: tipo.trim(), prescricao_id: prescId, duracao_min: num(dur), distancia_km: num(dist),
        calorias: num(cal), intensidade: int || null, observacoes: obs || null })
      onClose()
    } catch (e: any) { setErro(e?.message ?? 'Erro ao salvar') } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Registrar cardio"
      footer={<button onClick={salvar} disabled={saving} className="btn-primary w-full h-12">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar cardio</button>}>
      <div className="space-y-4">
        {prescricoes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Prescritos para você</p>
            <div className="flex flex-wrap gap-2">
              {prescricoes.map(p => (
                <button key={p.id} type="button" onClick={() => escolherPresc(p)}
                  className={cn('press rounded-full border px-4 min-h-[44px] transition-colors duration-150', prescId === p.id ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-foreground hover:bg-muted')}>
                  {p.tipo}{p.duracao_min ? ` · ${p.duracao_min}min` : ''}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Tipo</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_CARDIO.map(t => (
              <button key={t} type="button" onClick={() => { setTipo(t); setPrescId(null) }}
                className={cn('press rounded-full border px-4 min-h-[44px] transition-colors duration-150', tipo === t && !prescId ? 'bg-foreground border-foreground text-background' : 'border-border text-foreground hover:bg-muted')}>
                {t}
              </button>
            ))}
          </div>
          <input className="input-base mt-2" value={tipo} onChange={e => { setTipo(e.target.value); setPrescId(null) }} placeholder="Ou digite outro..." />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Duração (min)"><input className="input-base" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
          <Field label="Distância (km)"><input className="input-base" inputMode="decimal" value={dist} onChange={e => setDist(e.target.value)} /></Field>
          <Field label="Calorias"><input className="input-base" inputMode="numeric" value={cal} onChange={e => setCal(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Intensidade">
            <select className="input-base" value={int} onChange={e => setInt(e.target.value)}>
              <option value="">—</option>
              {INTENSIDADES.map(i => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Data"><input type="date" className="input-base" value={dia} onChange={e => setDia(e.target.value)} /></Field>
        </div>
        <Field label="Observações"><textarea className="input-base min-h-[60px]" value={obs} onChange={e => setObs(e.target.value)} placeholder="Como foi?" /></Field>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Sheet>
  )
}
