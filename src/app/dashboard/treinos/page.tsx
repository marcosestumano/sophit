import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { sortTreinos } from '@/lib/utils'
import { juntarAtividade } from '@/lib/secoes'
import { TreinosView } from '@/components/treinos/TreinosView'

export default async function TreinosPage({ searchParams }: { searchParams: { t?: string } }) {
  const supabase = createClient()
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [{ data: treinosRaw }, { data: progRaw }, { data: checks }] = await Promise.all([
    supabase.from('treinos').select('*').eq('user_id', user.id),
    supabase.from('progressao_exercicios').select('treino_id, data_registro')
      .eq('user_id', user.id).order('data_registro', { ascending: false }).limit(200),
    supabase.from('treino_checks').select('treino_id, data')
      .eq('user_id', user.id).order('data', { ascending: false }).limit(200),
  ])
  // Mobilidade/ativação marcadas também contam como treino feito no dia
  const prog = juntarAtividade(progRaw ?? [], checks ?? [])

  const treinos = sortTreinos((treinosRaw ?? []) as any[])
  return (
    <TreinosView
      userId={user.id}
      treinos={treinos}
      progressoes={prog}
      abrirId={searchParams.t ?? null}
    />
  )
}
