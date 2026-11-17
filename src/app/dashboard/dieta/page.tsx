import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { DietaView } from '@/components/dieta/DietaView'

export default async function DietaPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <DietaView userId={user.id} />
}
