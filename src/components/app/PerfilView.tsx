'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClipboardList, Camera, Moon, Sun, LogOut, ChevronRight, Pencil, Check, Loader2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app/AppShell'
import type { Profile } from '@/types'

export function PerfilView({ profile }: { profile: Profile }) {
  const supabase = createClient()
  const router = useRouter()
  const [nome, setNome] = useState(profile.full_name ?? '')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])

  function toggleTema() {
    const html = document.documentElement
    html.classList.toggle('dark')
    const now = html.classList.contains('dark')
    setDark(now)
    try { localStorage.setItem('theme', now ? 'dark' : 'light') } catch {}
  }

  async function salvarNome() {
    setSalvando(true)
    await supabase.from('profiles').update({ full_name: nome.trim() || null }).eq('id', profile.id)
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const iniciais = (nome || profile.email).split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <AppShell
      hero={
        <div className="flex flex-col items-center pt-4 pb-2 text-center">
          <div className="h-24 w-24 rounded-full bg-white/25 border-4 border-white/70 flex items-center justify-center text-3xl font-bold">{iniciais}</div>
          {editando ? (
            <div className="mt-3 flex items-center gap-2 w-full max-w-xs">
              <input autoFocus value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarNome()}
                className="flex-1 rounded-xl bg-white/90 text-gray-900 px-3 py-2 outline-none" />
              <button onClick={salvarNome} className="h-10 w-10 rounded-full bg-white text-brand-700 flex items-center justify-center" aria-label="Salvar nome">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditando(true)} className="mt-3 flex items-center gap-2 text-2xl font-bold drop-shadow-sm">
              {nome || 'Sem nome'} <Pencil className="h-4 w-4 opacity-80" />
            </button>
          )}
          <p className="text-sm opacity-90">{profile.email}</p>
          <p className="text-xs opacity-80 mt-1">Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
      }
    >
      <div className="app-card overflow-hidden">
        <Row href="/dashboard/anamnese" icon={ClipboardList} t="Minhas anamneses" d="Questionários e feedbacks" />
        <Row href="/dashboard/progresso" icon={Camera} t="Fotos de evolução" d="Antes e depois" />
        {profile.role === 'admin' && <Row href="/admin" icon={Shield} t="Painel do administrador" d="Gerenciar alunos" />}
      </div>

      <div className="app-card overflow-hidden mt-4">
        <button onClick={toggleTema} className="w-full flex items-center gap-4 px-4 py-4 text-left active:bg-muted/60">
          {dark ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
          <span className="flex-1 font-semibold text-foreground">Tema {dark ? 'claro' : 'escuro'}</span>
          <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${dark ? 'bg-brand-500' : 'bg-muted-foreground/30'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${dark ? 'translate-x-5' : ''}`} />
          </span>
        </button>
      </div>

      <button onClick={sair} className="app-card mt-4 w-full flex items-center gap-4 px-4 py-4 text-left text-destructive active:bg-muted/60">
        <LogOut className="h-5 w-5" /> <span className="font-semibold">Sair da conta</span>
      </button>
    </AppShell>
  )
}

function Row({ href, icon: Icon, t, d }: { href: string; icon: any; t: string; d: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0 active:bg-muted/60">
      <span className="h-10 w-10 rounded-full flex items-center justify-center bg-brand-100 dark:bg-brand-900/40">
        <Icon className="h-5 w-5 text-brand-600 dark:text-brand-300" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-foreground">{t}</span>
        <span className="block text-xs text-muted-foreground">{d}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}
