import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Dumbbell, Scale } from 'lucide-react'
import Link from 'next/link'
import { AvaliacaoSection } from '@/components/admin/AvaliacaoSection'
import { AvaliacaoResumo } from '@/components/admin/AvaliacaoResumo'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'
import { FotosProgresso } from '@/components/FotosProgresso'
import { PlanoAnualAdmin } from '@/components/admin/PlanoAnualAdmin'
import { sortTreinos } from '@/lib/utils'
import { DietaAdmin } from '@/components/dieta/DietaAdmin'
import { CardioAdmin } from '@/components/cardio/CardioAdmin'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: avaliacoes }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).single(),
    supabase.from('avaliacoes_fisicas').select('*').eq('user_id', params.id).order('created_at', { ascending: false }),
    supabase.from('treinos').select('*').eq('user_id', params.id).order('data_atribuicao', { ascending: true }).order('titulo', { ascending: true }),
  ])

  if (!profile) notFound()

  const initials = (profile.full_name ?? profile.email)
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-0">
      <Link href="/admin/usuarios"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para usuários
      </Link>

      {/* Profile Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#e8799f' }}>
            <span className="text-[#2c2325] text-xl font-medium">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-normal text-foreground">{profile.full_name ?? 'Sem nome'}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <div className="mt-3">
              <DeleteUserButton userId={params.id} userName={profile.full_name ?? 'Sem nome'} userEmail={profile.email} />
            </div>
          </div>
        </div>
      </div>

      {/* Resumo da última avaliação — sempre visível */}
      {avaliacoes && avaliacoes.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h2 className="text-xl tracking-[-0.02em] font-normal text-foreground mb-4">
            Dados da Avaliação Física
          </h2>
          <AvaliacaoResumo avaliacoes={avaliacoes} />
        </div>
      )}

      {/* Treinos — planejamento mês a mês + evolução anual */}
      <PlanoAnualAdmin userId={params.id} treinos={sortTreinos((treinos ?? []) as any[])} />

      {/* Dieta e Cardio */}
      <DietaAdmin userId={params.id} />
      <CardioAdmin userId={params.id} />

      {/* Fotos */}
      <div className="card p-5 sm:p-6">
        <h2 className="text-xl tracking-[-0.02em] font-normal text-foreground mb-4">
          Fotos de Progresso
        </h2>
        <FotosProgresso userId={params.id} isAdmin={true} />
      </div>

      {/* Avaliação Física — nova + histórico */}
      <div className="card p-5 sm:p-6">
        <h2 className="text-xl tracking-[-0.02em] font-normal text-foreground mb-5">
          Avaliação Física
        </h2>
        <AvaliacaoSection
          userId={params.id}
          userName={profile.full_name ?? profile.email}
          initialAvaliacoes={avaliacoes ?? []}
        />
      </div>
    </div>
  )
}
