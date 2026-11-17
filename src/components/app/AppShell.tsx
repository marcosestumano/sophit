'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Estrutura das telas do aluno: topo rosa + "folha" arredondada com o conteúdo. */
export function AppShell({
  hero, children, className,
}: { hero: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className="max-w-2xl mx-auto lg:rounded-3xl lg:overflow-hidden lg:border lg:border-border">
      <div className="app-hero px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-12 text-white">
        {hero}
      </div>
      <div className={cn('app-sheet -mt-7 relative px-4 pt-5 pb-6 min-h-[50vh]', className)}>
        {children}
      </div>
    </div>
  )
}

export function HeroTitle({ title, back = '/dashboard', right }: { title: string; back?: string | null; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 h-12">
      {back && (
        <Link href={back} className="p-1 -ml-1 rounded-full active:bg-white/20" aria-label="Voltar">
          <ArrowLeft className="h-6 w-6" />
        </Link>
      )}
      <h1 className="flex-1 text-xl font-bold truncate text-center pr-6 drop-shadow-sm">{title}</h1>
      {right}
    </div>
  )
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur px-3 py-1.5 text-sm font-semibold">
      {children}
    </span>
  )
}

export function ProgressBar({ value, color = '#e8799f', track = 'hsl(var(--muted))', className }: { value: number; color?: string; track?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 rounded-full overflow-hidden', className)} style={{ background: track }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export const CORES = {
  treino: '#e8799f',
  dieta: '#5fbf8a',
  cardio: '#a78bfa',
  agua: '#7cc4f2',
}
