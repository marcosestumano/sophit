import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { EvolucaoAnualAluno } from '@/components/treinos/EvolucaoAnualAluno'

export const metadata: Metadata = { title: 'Evolução no ano — Sophit' }

export default async function EvolucaoPage() {
  const supabase = createClient()
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase.from('treinos').select('*').eq('user_id', user.id)
  return <EvolucaoAnualAluno userId={user.id} treinos={(treinos ?? []) as any[]} />
}
