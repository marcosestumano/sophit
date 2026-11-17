import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DietaView } from '@/components/dieta/DietaView'

export default async function DietaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <DietaView userId={user.id} />
}
