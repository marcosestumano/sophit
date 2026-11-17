'use client'

import { useState } from 'react'
import { Calendar, Pill, Droplets, FileText, Utensils, ChevronRight, Plus, Pencil, Loader2 } from 'lucide-react'
import { AppScreen, ScreenHeader, SectionTitle, ProgressBar } from '@/components/app/AppShell'
import { Sheet } from '@/components/app/Sheet'
import { useDieta } from './useDieta'
import { PlanoEditor, RefeicaoEditor } from './Editores'
import { RefeicaoCard } from './RefeicaoCard'
import { somaMacros, round } from '@/lib/dieta'
import { dateKey } from '@/lib/dates'
import type { DietaRefeicao } from '@/types'

export function DietaView({ userId }: { userId: string }) {
  const [hoje] = useState(dateKey())
  const d = useDieta(userId, hoje)
  const [planoOpen, setPlanoOpen] = useState(false)
  const [refEdit, setRefEdit] = useState<DietaRefeicao | null | undefined>(undefined) // undefined = fechado, null = nova
  const [info, setInfo] = useState<{ t: string; v: string } | null>(null)

  const total = somaMacros(d.refeicoes)
  const feitas = d.refeicoes.filter(r => d.checks.has(r.id))
  const cons = somaMacros(feitas)
  const meta = {
    kcal: d.plano?.meta_kcal || total.kcal, proteina: d.plano?.meta_proteina || total.proteina,
    carbo: d.plano?.meta_carbo || total.carbo, gordura: d.plano?.meta_gordura || total.gordura,
  }
  const pct = meta.kcal ? Math.min(100, round((cons.kcal / meta.kcal) * 100)) : 0

  async function excluir(r: DietaRefeicao) {
    if (!confirm(`Excluir "${r.nome}"?`)) return
    await d.excluirRefeicao(r.id)
  }

  const n = (v: number) => round(v).toLocaleString('pt-BR')

  return (
    <AppScreen>
      <ScreenHeader
        title={d.plano?.titulo ?? 'Dieta'}
        sub={d.plano ? [d.plano.dias_semana, d.plano.prescricao].filter(Boolean).join(' · ') : undefined}
        right={d.plano ? (
          <button onClick={() => setPlanoOpen(true)} aria-label="Editar plano alimentar"
            className="press h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted">
            <Pencil className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
      />

      {d.loading && <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {d.erro && <div className="app-card p-4 mt-4 text-destructive">{d.erro}</div>}

      {!d.loading && !d.erro && !d.plano && (
        <div className="app-card p-8 mt-4 text-center">
          <Utensils className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" strokeWidth={1.5} />
          <p className="font-medium text-foreground">Você ainda não tem um plano alimentar</p>
          <p className="text-muted-foreground mt-1 mb-5">Seu profissional pode montar um, ou você monta o seu.</p>
          <button onClick={() => setPlanoOpen(true)} className="btn-primary"><Plus className="h-[18px] w-[18px]" /> Criar meu plano</button>
        </div>
      )}

      {!d.loading && d.plano && (
        <>
          <div className="app-card p-4 mt-2 flex items-center gap-4">
            <Ring pct={pct} />
            <div className="flex-1 min-w-0">
              <p className="text-[28px] leading-[1.1] tracking-[-0.03em] text-foreground">
                {n(cons.kcal)} <span className="text-base text-muted-foreground tracking-normal">/ {n(meta.kcal)} kcal</span>
              </p>
              <div className="flex gap-2.5 mt-3">
                <MacroBar l="P" v={cons.proteina} m={meta.proteina} />
                <MacroBar l="C" v={cons.carbo} m={meta.carbo} />
                <MacroBar l="G" v={cons.gordura} m={meta.gordura} />
              </div>
            </div>
          </div>

          <div className="app-card overflow-hidden mt-3">
            {d.plano.agua_litros != null && <InfoRow icon={Droplets} t="Ingestão hídrica" v={`${String(d.plano.agua_litros).replace('.', ',')} litros por dia`} />}
            <InfoRow icon={Calendar} t="Dias da semana" v={d.plano.dias_semana} />
            {d.plano.prescricao && <InfoRow icon={Pill} t="Prescrição" v={d.plano.prescricao} onClick={() => setInfo({ t: 'Prescrição', v: d.plano!.prescricao! })} />}
            {d.plano.refeicao_livre && <InfoRow icon={Utensils} t="Refeição livre" v={d.plano.refeicao_livre} onClick={() => setInfo({ t: 'Refeição livre', v: d.plano!.refeicao_livre! })} />}
            {d.plano.observacoes && <InfoRow icon={FileText} t="Observações" v={d.plano.observacoes} onClick={() => setInfo({ t: 'Observações', v: d.plano!.observacoes! })} />}
          </div>

          <SectionTitle right={<span className="text-xs font-medium text-muted-foreground">{feitas.length} de {d.refeicoes.length} feitas hoje</span>}>
            Minhas refeições
          </SectionTitle>

          <div className="space-y-3">
            {d.refeicoes.map(r => (
              <RefeicaoCard key={r.id} refeicao={r} checked={d.checks.has(r.id)} onToggle={() => d.toggleCheck(r.id)}
                onEdit={() => setRefEdit(r)} onDelete={() => excluir(r)} />
            ))}
            {d.refeicoes.length === 0 && <p className="text-muted-foreground text-center py-6">Nenhuma refeição cadastrada ainda.</p>}
          </div>

          <button onClick={() => setRefEdit(null)} className="btn-secondary w-full h-12 mt-4">
            <Plus className="h-[18px] w-[18px]" /> Adicionar refeição
          </button>
        </>
      )}

      <PlanoEditor open={planoOpen} onClose={() => setPlanoOpen(false)} plano={d.plano} onSave={d.salvarPlano} />
      <RefeicaoEditor open={refEdit !== undefined} onClose={() => setRefEdit(undefined)} refeicao={refEdit ?? null} onSave={d.salvarRefeicao} />
      <Sheet open={!!info} onClose={() => setInfo(null)} title={info?.t ?? ''}>
        <p className="whitespace-pre-wrap text-foreground">{info?.v}</p>
      </Sheet>
    </AppScreen>
  )
}

function Ring({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r
  return (
    <div className="relative h-[88px] w-[88px] flex-shrink-0">
      <svg role="img" aria-label={`${pct}% da meta de calorias`} viewBox="0 0 88 88" className="h-[88px] w-[88px] -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--cor-dieta)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl text-foreground">{pct}%</span>
    </div>
  )
}

function MacroBar({ l, v, m }: { l: string; v: number; m: number }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs font-medium"><span className="text-foreground">{l}</span><span className="text-muted-foreground">{round(v)} g</span></div>
      <ProgressBar value={m ? (v / m) * 100 : 0} color="hsl(var(--foreground))" className="h-1 mt-1" />
    </div>
  )
}

function InfoRow({ icon: Icon, t, v, onClick }: { icon: any; t: string; v: string; onClick?: () => void }) {
  const Comp: any = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick} className="w-full flex items-center gap-4 px-4 py-3 min-h-[64px] text-left border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
      <Icon className="h-5 w-5 text-foreground flex-shrink-0" strokeWidth={1.75} />
      <span className="flex-1 min-w-0">
        <span className="block font-medium text-foreground">{t}</span>
        <span className="block text-sm text-muted-foreground truncate">{v}</span>
      </span>
      {onClick && <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} />}
    </Comp>
  )
}
