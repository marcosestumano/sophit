'use client'

import { AppScreen, ScreenHeader } from '@/components/app/AppShell'
import { EvolucaoAnual } from '@/components/treinos/EvolucaoAnual'
import type { TreinoMensal } from '@/lib/periodizacao'

export function EvolucaoAnualAluno({ userId, treinos }: { userId: string; treinos: TreinoMensal[] }) {
  return (
    <AppScreen>
      <ScreenHeader title="Evolução no ano" sub="Como seus treinos e cargas evoluíram mês a mês" back="/dashboard/treinos" />
      <div className="mt-4">
        <EvolucaoAnual userId={userId} treinos={treinos} variante="aluno" />
      </div>
    </AppScreen>
  )
}
