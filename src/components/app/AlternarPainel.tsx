'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, User } from 'lucide-react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Alterna entre o painel do aluno (/dashboard) e o do administrador (/admin).
 * Só aparece para admin — e o /admin continua protegido no servidor (admin/layout.tsx).
 */
export function AlternarPainel({ profile, compacto = false }: { profile: Pick<Profile, 'role'>; compacto?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const noAdmin = pathname.startsWith('/admin')
  const [destino, setDestino] = useState<'aluno' | 'admin' | null>(null)

  useEffect(() => { router.prefetch(noAdmin ? '/dashboard' : '/admin') }, [noAdmin, router])
  useEffect(() => { setDestino(null) }, [pathname])

  if (profile.role !== 'admin') return null

  const atual = destino ?? (noAdmin ? 'admin' : 'aluno')
  function ir(p: 'aluno' | 'admin') {
    if (p === atual) return
    setDestino(p)
    router.push(p === 'admin' ? '/admin' : '/dashboard')
  }

  const opcoes = [
    { id: 'aluno' as const, label: 'Aluno', icon: User },
    { id: 'admin' as const, label: 'Admin', icon: Shield },
  ]

  return (
    <div role="radiogroup" aria-label="Painel"
      className={cn('grid grid-cols-2 gap-1 p-1 rounded-2xl bg-muted', compacto ? 'h-10' : 'h-12')}>
      {opcoes.map(o => {
        const ativo = atual === o.id
        return (
          <button key={o.id} role="radio" aria-checked={ativo} onClick={() => ir(o.id)}
            className={cn('press rounded-xl flex items-center justify-center gap-2 font-medium transition-colors duration-150',
              compacto ? 'text-sm' : 'text-base',
              ativo ? 'bg-card text-foreground border border-border' : 'text-muted-foreground hover:text-foreground')}>
            <o.icon className="h-4 w-4" strokeWidth={1.75} /> {o.label}
          </button>
        )
      })}
    </div>
  )
}
