import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { subDays, format } from 'date-fns'
import { HomeView } from '@/components/home/HomeView'
import { sortTreinos } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Janela de histórico para sequências e calendário (folga para fuso horário)
  const desde = format(subDays(new Date(), 120), 'yyyy-MM-dd')

  const [profileRes, treinosRes, progRes, planoRes, cardioPRes, cardioRRes, avalRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('treinos').select('id, titulo, lista_exercicios, data_atribuicao, ordem, ativo').eq('user_id', user.id).eq('ativo', true),
    supabase.from('progressao_exercicios').select('treino_id, data_registro').eq('user_id', user.id).gte('data_registro', desde),
    supabase.from('dieta_planos').select('*').eq('user_id', user.id).eq('ativo', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('cardio_prescricoes').select('*').eq('user_id', user.id).eq('ativo', true),
    supabase.from('cardio_registros').select('id, data, tipo, duracao_min').eq('user_id', user.id).gte('data', desde),
    supabase.from('avaliacoes_fisicas').select('peso, percentual_gordura, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
  ])

  const plano = planoRes.data?.[0] ?? null
  let refeicoes: any[] = []
  let checks: any[] = []
  let dietaErro = !!planoRes.error
  if (plano) {
    const [r, c] = await Promise.all([
      supabase.from('dieta_refeicoes').select('*').eq('plano_id', plano.id),
      supabase.from('dieta_checks').select('refeicao_id, data').eq('user_id', user.id).gte('data', desde),
    ])
    refeicoes = r.data ?? []
    checks = c.data ?? []
    dietaErro = dietaErro || !!r.error || !!c.error
  }

  // Áreas que não carregaram: a Home mostra erro em vez de "vazio"
  const falhas = [
    (treinosRes.error || progRes.error) && 'treino',
    dietaErro && 'dieta',
    (cardioPRes.error || cardioRRes.error) && 'cardio',
    avalRes.error && 'progresso',
  ].filter(Boolean) as ('treino' | 'dieta' | 'cardio' | 'progresso')[]
  for (const [nome, r] of Object.entries({ treinosRes, progRes, planoRes, cardioPRes, cardioRRes, avalRes })) {
    if (r.error) console.error(`[home] ${nome}:`, r.error.message)
  }

  const nome = (profileRes.data?.full_name ?? profileRes.data?.email ?? 'Aluno').split(' ')[0]

  return (
    <HomeView
      nome={nome}
      treinos={sortTreinos((treinosRes.data ?? []) as any[])}
      progressoes={progRes.data ?? []}
      plano={plano}
      refeicoes={refeicoes}
      checks={checks}
      cardioPrescricoes={cardioPRes.data ?? []}
      cardioRegistros={cardioRRes.data ?? []}
      avaliacoes={avalRes.data ?? []}
      falhas={falhas}
    />
  )
}
