'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ordenarRefeicoes } from '@/lib/dieta'
import type { DietaPlano, DietaRefeicao } from '@/types'

export type PlanoInput = Omit<DietaPlano, 'id' | 'user_id' | 'ativo' | 'created_at'>
export type RefeicaoInput = Pick<DietaRefeicao, 'nome' | 'horario' | 'alimentos' | 'observacoes'> & { id?: string }

export function useDieta(userId: string, data?: string) {
  const supabase = useMemo(() => createClient(), [])
  const [plano, setPlano] = useState<DietaPlano | null>(null)
  const [refeicoes, setRefeicoes] = useState<DietaRefeicao[]>([])
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data: planos, error } = await supabase.from('dieta_planos').select('*')
      .eq('user_id', userId).eq('ativo', true).order('created_at', { ascending: false }).limit(1)
    if (error) {
      setErro(error.message.includes('dieta_planos')
        ? 'As tabelas de dieta ainda não existem. Rode a migration 003_dieta_cardio.sql no Supabase.'
        : 'Erro ao carregar a dieta.')
      setLoading(false)
      return
    }
    const p = (planos?.[0] as DietaPlano) ?? null
    setPlano(p)
    if (p) {
      const { data: refs } = await supabase.from('dieta_refeicoes').select('*').eq('plano_id', p.id)
      setRefeicoes(ordenarRefeicoes((refs ?? []) as DietaRefeicao[]))
      if (data) {
        const { data: cks } = await supabase.from('dieta_checks').select('refeicao_id').eq('user_id', userId).eq('data', data)
        setChecks(new Set((cks ?? []).map((c: any) => c.refeicao_id)))
      }
    } else {
      setRefeicoes([])
      setChecks(new Set())
    }
    setLoading(false)
  }, [supabase, userId, data])

  useEffect(() => { carregar() }, [carregar])

  async function salvarPlano(input: PlanoInput) {
    if (plano) {
      const { error } = await supabase.from('dieta_planos').update({ ...input, updated_at: new Date().toISOString() }).eq('id', plano.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('dieta_planos').insert({ ...input, user_id: userId, ativo: true })
      if (error) throw error
    }
    await carregar()
  }

  async function salvarRefeicao(input: RefeicaoInput) {
    if (!plano) throw new Error('Crie o plano primeiro')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      nome: input.nome, horario: input.horario || null,
      alimentos: input.alimentos, observacoes: input.observacoes || null,
    }
    const { error } = input.id
      ? await supabase.from('dieta_refeicoes').update(payload).eq('id', input.id)
      : await supabase.from('dieta_refeicoes').insert({ ...payload, plano_id: plano.id, user_id: userId, ordem: refeicoes.length, criado_por: user?.id })
    if (error) throw error
    await carregar()
  }

  async function excluirRefeicao(id: string) {
    const { error } = await supabase.from('dieta_refeicoes').delete().eq('id', id)
    if (error) throw error
    setRefeicoes(r => r.filter(x => x.id !== id))
  }

  async function toggleCheck(refeicaoId: string) {
    if (!data) return
    const marcado = checks.has(refeicaoId)
    // otimista
    setChecks(prev => {
      const n = new Set(prev)
      marcado ? n.delete(refeicaoId) : n.add(refeicaoId)
      return n
    })
    const { error } = marcado
      ? await supabase.from('dieta_checks').delete().eq('refeicao_id', refeicaoId).eq('data', data)
      : await supabase.from('dieta_checks').insert({ refeicao_id: refeicaoId, user_id: userId, data })
    if (error) {
      setChecks(prev => {
        const n = new Set(prev)
        marcado ? n.add(refeicaoId) : n.delete(refeicaoId)
        return n
      })
    }
  }

  return { plano, refeicoes, checks, loading, erro, carregar, salvarPlano, salvarRefeicao, excluirRefeicao, toggleCheck }
}
