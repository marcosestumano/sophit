'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, ClipboardList, UserCircle, Dumbbell, Utensils, HeartPulse, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PrescricoesResumo {
  treinos: number
  refeicoes: number
  cardios: number
}

const PRESC_ROUTES = ['/dashboard/treinos', '/dashboard/dieta', '/dashboard/cardio']

export function MobileNav({ resumo }: { resumo: PrescricoesResumo }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  const isHome = pathname === '/dashboard'
  const isPresc = PRESC_ROUTES.some(r => pathname.startsWith(r))
  const isPerfil = pathname.startsWith('/dashboard/perfil')

  const opcoes = [
    { href: '/dashboard/treinos', label: 'Treinos', desc: 'Ver todos os seus treinos', icon: Dumbbell, cor: '#e8799f', bg: 'rgba(232,121,159,0.18)',
      info: `${resumo.treinos} treino${resumo.treinos !== 1 ? 's' : ''} no plano` },
    { href: '/dashboard/dieta', label: 'Dieta', desc: 'Ver suas refeições', icon: Utensils, cor: '#5fbf8a', bg: 'rgba(95,191,138,0.18)',
      info: `${resumo.refeicoes} refeiç${resumo.refeicoes !== 1 ? 'ões' : 'ão'} no plano` },
    { href: '/dashboard/cardio', label: 'Cardio', desc: 'Seus cardios da semana', icon: HeartPulse, cor: '#a78bfa', bg: 'rgba(167,139,250,0.18)',
      info: `${resumo.cardios} cardio${resumo.cardios !== 1 ? 's' : ''} prescrito${resumo.cardios !== 1 ? 's' : ''}` },
  ]

  return (
    <>
      {/* Sheet de Prescrições */}
      <div
        className={cn('fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 app-sheet px-5 pt-3 pb-safe transition-transform duration-300 lg:hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-label="Prescrições"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        <h2 className="text-2xl font-bold text-foreground">Prescrições</h2>
        <p className="text-muted-foreground mb-5">Escolha o que você quer ver</p>
        <div className="app-card overflow-hidden mb-6">
          {opcoes.map((o, i) => (
            <button
              key={o.href}
              onClick={() => router.push(o.href)}
              className={cn('w-full flex items-center gap-4 p-4 text-left active:bg-muted transition-colors', i > 0 && 'border-t border-border')}
            >
              <span className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                style={{ background: o.bg, borderColor: o.cor }}>
                <o.icon className="h-6 w-6" style={{ color: o.cor }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold text-foreground">{o.label}</span>
                <span className="block text-sm text-foreground/80">{o.desc}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{o.info}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-safe lg:hidden">
        <div className="grid grid-cols-3 h-[72px]">
          <NavItem href="/dashboard" label="Início" icon={Home} active={isHome && !open} />
          <button onClick={() => setOpen(v => !v)} className="flex flex-col items-center justify-center gap-1">
            <Pill active={isPresc || open}><ClipboardList className="h-5 w-5" /></Pill>
            <span className={cn('text-xs font-medium', isPresc || open ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground')}>Prescrições</span>
          </button>
          <NavItem href="/dashboard/perfil" label="Perfil" icon={UserCircle} active={isPerfil && !open} />
        </div>
      </nav>
    </>
  )
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('flex items-center justify-center h-8 w-16 rounded-full transition-colors',
      active ? 'bg-brand-200 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200' : 'text-muted-foreground')}>
      {children}
    </span>
  )
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1">
      <Pill active={active}><Icon className="h-5 w-5" /></Pill>
      <span className={cn('text-xs font-medium', active ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground')}>{label}</span>
    </Link>
  )
}
