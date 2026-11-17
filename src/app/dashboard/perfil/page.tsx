import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { PerfilView } from '@/components/app/PerfilView'

export default async function PerfilPage() {
  const supabase = createClient()
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  return <PerfilView profile={profile} />
}
