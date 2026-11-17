import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CardioView } from '@/components/cardio/CardioView'

export default async function CardioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <CardioView userId={user.id} />
}
