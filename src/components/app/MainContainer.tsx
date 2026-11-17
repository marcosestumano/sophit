'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Rotas com layout "app" (cabeçalho rosa de ponta a ponta no celular)
const APP_ROUTES = ['/dashboard', '/dashboard/treinos', '/dashboard/dieta', '/dashboard/cardio', '/dashboard/perfil']

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const app = APP_ROUTES.includes(pathname)
  return (
    <main className={cn(
      'flex-1 overflow-y-auto animate-fade-in pb-28 lg:pb-6 lg:p-6',
      !app && 'p-4 pt-6'
    )}>
      {children}
    </main>
  )
}
