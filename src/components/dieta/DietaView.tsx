'use client'

import { useState } from 'react'
import { Calendar, ClipboardList, Droplets, FileText, Utensils, ChevronRight, Plus, Pencil, Loader2 } from 'lucide-react'
import { AppShell, HeroTitle, ProgressBar } from '@/components/app/AppShell'
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

  return (
    <AppShell
      hero={
        <>
          <HeroTitle title={d.plano?.titulo ?? 'Dieta'} right={d.plano ? (
            <button onClick={() => setPlanoOpen(true)} className="p-1 rounded-full active:bg-white/20" aria-label="Editar plano"><Pencil className="h-5 w-5" /></button>
          ) : null} />
          {d.plano && (
            <div className="mt-3 flex items-center gap-4">
              <Ring pct={pct} />
              <div className="flex-1 min-w-0">
                <p><span className="text-3xl font-bold">{round(cons.kcal)}</span> <span className="opacity-85">/ {round(meta.kcal)} kcal</span></p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-semibold">
                  <MacroBar l="P" v={cons.proteina} m={meta.proteina} c="#ffffff" />
                  <MacroBar l="C" v={cons.carbo} m={meta.carbo} c="#fde68a" />
                  <MacroBar l="G" v={cons.gordura} m={meta.gordura} c="#fbcfe8" />
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      {d.loading && <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>}
      {d.erro && <div className="app-card p-4 text-sm text-destructive">{d.erro}</div>}

      {!d.loading && !d.erro && !d.plano && (
        <div className="app-card p-8 text-center">
          <Utensils className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-medium text-foreground">Você ainda não tem um plano alimentar</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Seu profissional pode prescrever um, ou você pode montar o seu.</p>
          <button onClick={() => setPlanoOpen(true)} className="btn-primary rounded-xl px-5 py-2.5"><Plus className="h-4 w-4" /> Criar meu plano</button>
        </div>
      )}

      {!d.loading && d.plano && (
        <>
          <div className="app-card overflow-hidden">
            <InfoRow icon={Calendar} t="Dias da semana" v={d.plano.dias_semana} />
            {d.plano.prescricao && <InfoRow icon={ClipboardList} t="Prescrição" v={d.plano.prescricao} onClick={() => setInfo({ t: 'Prescrição', v: d.plano!.prescricao! })} />}
            {d.plano.agua_litros != null && <InfoRow icon={Droplets} t="Ingestão hídrica" v={`${String(d.plano.agua_litros).replace('.', ',')} litros por dia`} />}
            {d.plano.observacoes && <InfoRow icon={FileText} t="Observações" v={d.plano.observacoes} onClick={() => setInfo({ t: 'Observações', v: d.plano!.observacoes! })} />}
            {d.plano.refeicao_livre && <InfoRow icon={Utensils} t="Refeição livre" v={d.plano.refeicao_livre} onClick={() => setInfo({ t: 'Refeição livre', v: d.plano!.refeicao_livre! })} />}
          </div>

          <div className="flex items-center justify-between mt-6 mb-3">
            <h2 className="text-lg font-bold text-foreground">Minhas refeições</h2>
            <span className="text-sm text-muted-foreground">{feitas.length}/{d.refeicoes.length} feitas hoje</span>
          </div>

          <div className="space-y-3">
            {d.refeicoes.map(r => (
              <RefeicaoCard key={r.id} refeicao={r} checked={d.checks.has(r.id)} onToggle={() => d.toggleCheck(r.id)}
                onEdit={() => setRefEdit(r)} onDelete={() => excluir(r)} />
            ))}
            {d.refeicoes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma refeição cadastrada ainda.</p>}
          </div>

          <button onClick={() => setRefEdit(null)} className="btn-secondary w-full rounded-2xl py-3 mt-4">
            <Plus className="h-4 w-4" /> Adicionar refeição
          </button>
        </>
      )}

      <PlanoEditor open={planoOpen} onClose={() => setPlanoOpen(false)} plano={d.plano} onSave={d.salvarPlano} />
      <RefeicaoEditor open={refEdit !== undefined} onClose={() => setRefEdit(undefined)} refeicao={refEdit ?? null} onSave={d.salvarRefeicao} />
      <Sheet open={!!info} onClose={() => setInfo(null)} title={info?.t ?? ''}>
        <p className="whitespace-pre-wrap text-foreground">{info?.v}</p>
      </Sheet>
    </AppShell>
  )
}

function Ring({ pct }: { pct: number }) {
  const r = 38, c = 2 * Math.PI * r
  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#5fbf8a" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{pct}%</span>
        <span className="text-[10px] opacity-85">do dia</span>
      </div>
    </div>
  )
}

function MacroBar({ l, v, m, c }: { l: string; v: number; m: number; c: string }) {
  return (
    <div>
      <div className="flex justify-between"><span>{l}</span><span className="opacity-85">{round(v)}g</span></div>
      <ProgressBar value={m ? (v / m) * 100 : 0} color={c} track="rgba(255,255,255,0.3)" className="h-1.5 mt-1" />
    </div>
  )
}

function InfoRow({ icon: Icon, t, v, onClick }: { icon: any; t: string; v: string; onClick?: () => void }) {
  const Comp: any = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick} className="w-full flex items-center gap-4 px-4 py-3.5 text-left border-b border-border last:border-b-0 active:bg-muted/60">
      <Icon className="h-5 w-5 text-foreground flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-foreground">{t}</span>
        <span className="block text-sm text-muted-foreground truncate">{v}</span>
      </span>
      {onClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </Comp>
  )
}
