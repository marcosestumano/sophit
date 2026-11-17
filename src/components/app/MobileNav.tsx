'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, ClipboardList, UserCircle, Dumbbell, Utensils, HeartPulse, ChevronRight } from 'lucide-react'
import { IconChip, CORES } from '@/components/app/AppShell'
import { cn } from '@/lib/utils'

export interface PrescricoesResumo {
  treinos: number
  refeicoes: number
  cardios: number
}

const PRESC_ROUTES = ['/dashboard/treinos', '/dashboard/dieta', '/dashboard/cardio']
const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`

export function MobileNav({ resumo }: { resumo: PrescricoesResumo }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  const isHome = pathname === '/dashboard'
  const isPresc = PRESC_ROUTES.some(r => pathname.startsWith(r))
  const isPerfil = pathname.startsWith('/dashboard/perfil')

  const opcoes = [
    { href: '/dashboard/treinos', label: 'Treinos', desc: 'Seus treinos da semana', icon: Dumbbell, cor: 'var(--rose-text)', tint: CORES.treinoTint,
      info: `${plural(resumo.treinos, 'treino', 'treinos')} no plano` },
    { href: '/dashboard/dieta', label: 'Dieta', desc: 'Refeições e metas do dia', icon: Utensils, cor: CORES.dieta, tint: CORES.dietaTint,
      info: `${plural(resumo.refeicoes, 'refeição', 'refeições')} por dia` },
    { href: '/dashboard/cardio', label: 'Cardio', desc: 'Prescrito e registrado', icon: HeartPulse, cor: CORES.cardio, tint: CORES.cardioTint,
      info: `${plural(resumo.cardios, 'cardio prescrito', 'cardios prescritos')}` },
  ]

  return (
    <>
      <div
        className={cn('fixed inset-0 z-40 bg-[#2c2325]/45 transition-opacity duration-200 lg:hidden', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <section
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+96px)] transition-transform duration-200 ease-out lg:hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-label="Prescrições"
        aria-hidden={!open}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-foreground/20" />
        <h2 className="text-[28px] font-normal tracking-[-0.03em] text-foreground">Prescrições</h2>
        <p className="text-muted-foreground mt-1 mb-3">O que o seu profissional montou para você.</p>
        {opcoes.map((o, i) => (
          <button
            key={o.href}
            onClick={() => router.push(o.href)}
            tabIndex={open ? 0 : -1}
            className={cn('w-full flex items-center gap-4 py-4 text-left min-h-[72px]', i > 0 && 'border-t border-border')}
          >
            <IconChip icon={o.icon} color={o.cor} tint={o.tint} size={52} />
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-medium text-foreground">{o.label}</span>
              <span className="block text-foreground">{o.desc}</span>
              <span className="block text-xs font-medium text-muted-foreground">{o.info}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </button>
        ))}
      </section>

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-[55] border-t border-border bg-card pb-safe lg:hidden">
        <div className="grid grid-cols-3 h-20 px-2 pb-2">
          <NavItem href="/dashboard" label="Início" icon={Home} active={isHome && !open} />
          <button onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex flex-col items-center justify-center gap-1">
            <Pill active={isPresc || open}><ClipboardList className="h-[22px] w-[22px]" strokeWidth={1.75} /></Pill>
            <span className={cn('text-xs font-medium', isPresc || open ? 'text-foreground' : 'text-muted-foreground')}>Prescrições</span>
          </button>
          <NavItem href="/dashboard/perfil" label="Perfil" icon={UserCircle} active={isPerfil && !open} />
        </div>
      </nav>
    </>
  )
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('flex items-center justify-center h-8 w-16 rounded-full transition-colors duration-150',
      active ? 'bg-[rgba(232,121,159,0.18)] text-foreground' : 'text-muted-foreground')}>
      {children}
    </span>
  )
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className="flex flex-col items-center justify-center gap-1">
      <Pill active={active}><Icon className="h-[22px] w-[22px]" strokeWidth={1.75} /></Pill>
      <span className={cn('text-xs font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </Link>
  )
}
