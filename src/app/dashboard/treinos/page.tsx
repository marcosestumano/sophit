import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sortTreinos } from '@/lib/utils'
import { TreinosView } from '@/components/treinos/TreinosView'

export default async function TreinosPage({ searchParams }: { searchParams: { t?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: treinosRaw }, { data: prog }] = await Promise.all([
    supabase.from('treinos').select('*').eq('user_id', user.id),
    supabase.from('progressao_exercicios').select('treino_id, data_registro')
      .eq('user_id', user.id).order('data_registro', { ascending: false }).limit(200),
  ])

  const treinos = sortTreinos((treinosRaw ?? []) as any[])
  return (
    <TreinosView
      userId={user.id}
      treinos={treinos}
      progressoes={prog ?? []}
      abrirId={searchParams.t ?? null}
    />
  )
}
