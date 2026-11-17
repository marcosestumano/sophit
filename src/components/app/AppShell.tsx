'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tela do aluno: fundo neutro, conteúdo com margem de 24px (taste-skill). */
export function AppScreen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-2xl mx-auto px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-6 lg:pt-2', className)}>
      {children}
    </div>
  )
}

export function ScreenHeader({ title, sub, back = '/dashboard', right }: {
  title: string; sub?: string; back?: string | null; right?: React.ReactNode
}) {
  return (
    <header className="pb-2">
      <div className="flex items-center justify-between h-11">
        {back ? (
          <Link href={back} aria-label="Voltar para o início"
            className="press -ml-2.5 h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted">
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </Link>
        ) : <span />}
        {right}
      </div>
      <h1 className="enter mt-3 text-[34px] leading-[1.1] font-normal tracking-[-0.03em] text-foreground">{title}</h1>
      {sub && <p className="enter-2 mt-1 text-muted-foreground">{sub}</p>}
    </header>
  )
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mt-8 mb-3 gap-3">
      <h2 className="text-[22px] font-normal tracking-[-0.02em] text-foreground">{children}</h2>
      {right}
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--cor-treino)', track, className }: { value: number; color?: string; track?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1.5 rounded-full overflow-hidden', !track && 'bg-foreground/10', className)} style={track ? { background: track } : undefined}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/** Círculo com ícone (chips das categorias). */
export function IconChip({ icon: Icon, color, tint, size = 44 }: { icon: any; color: string; tint: string; size?: number }) {
  return (
    <span className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: tint, color }}>
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  )
}

export const CORES = {
  treino: 'var(--cor-treino)',
  dieta: 'var(--cor-dieta)',
  cardio: 'var(--cor-cardio)',
  treinoTint: 'rgba(232,121,159,0.18)',
  dietaTint: 'rgba(63,122,82,0.13)',
  cardioTint: 'rgba(58,104,168,0.13)',
}
