'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { TreinoCardAdmin } from '@/components/admin/TreinoCardAdmin'
import { createClient } from '@/lib/supabase/client'

interface Exercicio {
  nome: string; series: number; reps: string; carga?: string; observacoes?: string
}
interface Treino {
  id: string; titulo: string; descricao: string | null
  lista_exercicios: Exercicio[]; data_atribuicao: string; ativo: boolean; user_id: string
  ordem?: number | null
}
interface Props { treinos: Treino[]; userId: string }

export function TreinosListAdmin({ treinos: initialTreinos, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<Treino[]>(initialTreinos)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)
  const dragOverRef = useRef<number | null>(null)
  const [dragActive, setDragActive] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Mantém a lista em sincronia quando o servidor manda dados novos (novo treino, edição, exclusão)
  useEffect(() => { setItems(initialTreinos) }, [initialTreinos])

  async function persistOrder(next: Treino[], previous: Treino[]) {
    setItems(next)
    setSaving(true)
    setSaveError(null)
    const results = await Promise.all(
      next.map((t, i) => supabase.from('treinos').update({ ordem: i }).eq('id', t.id))
    )
    setSaving(false)
    const failed = results.find(r => r.error)
    if (failed?.error) {
      console.error('Erro ao salvar ordem dos treinos:', failed.error)
      setItems(previous)
      setSaveError(
        failed.error.message?.includes('ordem')
          ? 'Coluna "ordem" não existe no banco. Rode a migration 002_treinos_ordem.sql no Supabase.'
          : 'Não foi possível salvar a nova ordem. Tente novamente.'
      )
      return
    }
    router.refresh()
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length || saving) return
    const previous = items
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(next, previous)
  }

  function onDragStart(e: React.DragEvent, i: number) {
    dragIndex.current = i
    e.dataTransfer.effectAllowed = 'move'
    // Firefox exige dados no dataTransfer para iniciar o drag
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
    // Adia o re-render para não cancelar o drag em alguns navegadores
    requestAnimationFrame(() => setDragActive(i))
  }

  function onDragEnter(i: number) {
    if (dragIndex.current === null) return
    dragOverRef.current = i
    setDragOver(i)
  }

  function finishDrag() {
    const from = dragIndex.current
    const to = dragOverRef.current
    dragIndex.current = null
    dragOverRef.current = null
    setDragActive(null)
    setDragOver(null)
    if (from !== null && to !== null) reorder(from, to)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    finishDrag()
  }

  function onDragEnd() {
    // Se o drop já tratou, dragIndex é null e nada acontece
    if (dragIndex.current !== null) finishDrag()
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      {(saving || saveError) && (
        <div className="flex items-center gap-2 text-xs" style={{ color: saveError ? '#dc2626' : '#d45f88' }}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saveError ?? 'Salvando nova ordem...'}
        </div>
      )}
      {items.map((t, i) => (
        <div
          key={t.id}
          draggable={!saving}
          onDragStart={e => onDragStart(e, i)}
          onDragEnter={() => onDragEnter(i)}
          onDragEnd={onDragEnd}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
          onDrop={onDrop}
          className="transition-all duration-150"
          style={{
            opacity: dragActive === i ? 0.35 : 1,
            transform: dragOver === i && dragActive !== i ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {/* Drag handle bar */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-grab active:cursor-grabbing select-none"
            style={{
              background: dragOver === i && dragActive !== i
                ? 'rgba(232,121,159,0.12)'
                : 'rgba(232,121,159,0.06)',
              border: dragOver === i && dragActive !== i
                ? '1px solid rgba(232,121,159,0.5)'
                : '1px solid rgba(232,121,159,0.15)',
              borderBottom: 'none',
            }}
            title="Arraste para reordenar"
          >
            <GripVertical className="h-4 w-4" style={{ color: '#d45f88' }} />
            <span className="flex-1 text-xs font-medium" style={{ color: '#d45f88' }}>
              {i + 1}º treino — arraste para reordenar
            </span>
            <button
              type="button"
              onClick={() => reorder(i, i - 1)}
              disabled={i === 0 || saving}
              className="p-1 rounded hover:bg-brand-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mover para cima"
            >
              <ChevronUp className="h-4 w-4" style={{ color: '#d45f88' }} />
            </button>
            <button
              type="button"
              onClick={() => reorder(i, i + 1)}
              disabled={i === items.length - 1 || saving}
              className="p-1 rounded hover:bg-brand-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mover para baixo"
            >
              <ChevronDown className="h-4 w-4" style={{ color: '#d45f88' }} />
            </button>
          </div>

          {/* Card wrapper */}
          <div
            className="rounded-b-lg rounded-tr-lg transition-all duration-150"
            style={{
              border: dragOver === i && dragActive !== i
                ? '1px solid rgba(232,121,159,0.5)'
                : '1px solid hsl(var(--border))',
              borderTop: 'none',
              padding: '14px',
              background: 'hsl(var(--card))',
            }}
          >
            <TreinoCardAdmin treino={t} userId={userId} />
          </div>

          {i < items.length - 1 && (
            <div className="mt-6 border-b border-border" />
          )}
        </div>
      ))}
    </div>
  )
}
