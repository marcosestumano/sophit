import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileNav } from '@/components/app/MobileNav'
import { MainContainer } from '@/components/app/MainContainer'
import { DescansoProvider } from '@/components/treinos/Descanso'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const user = await getAuthUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Resumo para o menu "Prescrições" (tolerante a tabelas ainda não criadas)
  const [treinosRes, planoRes, cardioRes] = await Promise.all([
    supabase.from('treinos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('ativo', true),
    supabase.from('dieta_planos').select('id').eq('user_id', user.id).eq('ativo', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('cardio_prescricoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('ativo', true),
  ])
  let refeicoes = 0
  const planoId = planoRes.data?.[0]?.id
  if (planoId) {
    const { count } = await supabase.from('dieta_refeicoes').select('id', { count: 'exact', head: true }).eq('plano_id', planoId)
    refeicoes = count ?? 0
  }

  return (
    <DescansoProvider>
    <div className="flex h-[100dvh] bg-background">
      <div className="hidden lg:flex">
        <Sidebar profile={profile} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden lg:block">
          <Header profile={profile} />
        </div>
        <MainContainer>{children}</MainContainer>
      </div>
      <MobileNav resumo={{ treinos: treinosRes.count ?? 0, refeicoes, cardios: cardioRes.count ?? 0 }} />
    </div>
    </DescansoProvider>
  )
}
