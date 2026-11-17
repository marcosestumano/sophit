import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { CardioView } from '@/components/cardio/CardioView'

export default async function CardioPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <CardioView userId={user.id} />
}
