'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClipboardList, Camera, Moon, LogOut, ChevronRight, Pencil, Check, Loader2, Smartphone, Share, SquarePlus } from 'lucide-react'
import { Sheet } from '@/components/app/Sheet'
import { useInstall, limparCachePwa } from '@/lib/pwa'
import { createClient } from '@/lib/supabase/client'
import { AppScreen, IconChip } from '@/components/app/AppShell'
import { AlternarPainel } from '@/components/app/AlternarPainel'
import type { Profile } from '@/types'

export function PerfilView({ profile }: { profile: Profile }) {
  const supabase = createClient()
  const router = useRouter()
  const [nome, setNome] = useState(profile.full_name ?? '')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [dark, setDark] = useState(false)
  const { state: instalacao, install } = useInstall()
  const [iosOpen, setIosOpen] = useState(false)

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
    await limparCachePwa()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const iniciais = (nome || profile.email).split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <AppScreen>
      <header className="pt-8 pb-2 flex flex-col items-center text-center">
        <span className="h-[88px] w-[88px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[34px]">{iniciais}</span>
        {editando ? (
          <div className="mt-4 flex items-center gap-2 w-full max-w-xs">
            <label htmlFor="perfil-nome" className="sr-only">Seu nome</label>
            <input id="perfil-nome" autoFocus value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarNome()}
              className="input-base flex-1" />
            <button onClick={salvarNome} className="btn-primary px-0 w-11" aria-label="Salvar nome">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
            </button>
          </div>
        ) : (
          <h1 className="enter mt-4 text-[28px] leading-tight font-normal tracking-[-0.03em] text-foreground">{nome || 'Sem nome'}</h1>
        )}
        <p className="enter-2 text-muted-foreground">{profile.email}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          {profile.role === 'admin' ? 'Administrador' : 'Aluno'} desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        {!editando && (
          <button onClick={() => setEditando(true)} className="btn-secondary mt-4"><Pencil className="h-4 w-4" strokeWidth={1.75} /> Editar nome</button>
        )}
      </header>

      {profile.role === 'admin' && (
        <div className="app-card p-4 mt-6">
          <p className="font-medium text-foreground">Painel</p>
          <p className="text-sm text-muted-foreground mb-3">Alterne entre a visão de aluno e a gestão dos alunos.</p>
          <AlternarPainel profile={profile} />
        </div>
      )}

      <div className="app-card overflow-hidden mt-6">
        <Row href="/dashboard/anamnese" icon={ClipboardList} t="Minhas anamneses" d="Questionários e respostas" />
        <Row href="/dashboard/progresso" icon={Camera} t="Fotos de evolução" d="Antes e depois" />
      </div>

      {(instalacao === 'prompt' || instalacao === 'ios') && (
        <div className="app-card overflow-hidden mt-3">
          <button onClick={() => (instalacao === 'prompt' ? install() : setIosOpen(true))}
            className="w-full flex items-center gap-4 px-4 py-3 min-h-[72px] text-left hover:bg-muted/50 transition-colors duration-150">
            <IconChip icon={Smartphone} color="hsl(var(--foreground))" tint="hsl(var(--muted))" />
            <span className="flex-1">
              <span className="block font-medium text-foreground">Instalar o app</span>
              <span className="block text-sm text-muted-foreground">Abra o Sophit direto da tela inicial, em tela cheia</span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <Sheet open={iosOpen} onClose={() => setIosOpen(false)} title="Instalar no iPhone">
        <ol className="space-y-4">
          <li className="flex gap-3"><Share className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.75} /><span>No Safari, toque em <b className="font-medium">Compartilhar</b>, na barra de baixo.</span></li>
          <li className="flex gap-3"><SquarePlus className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.75} /><span>Role e toque em <b className="font-medium">Adicionar à Tela de Início</b>.</span></li>
          <li className="flex gap-3"><Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.75} /><span>Toque em <b className="font-medium">Adicionar</b>. O Sophit aparece na sua tela inicial.</span></li>
        </ol>
        <p className="text-sm text-muted-foreground mt-5">Precisa ser pelo Safari; outros navegadores no iPhone não instalam apps.</p>
      </Sheet>

      <div className="app-card overflow-hidden mt-3">
        <div className="flex items-center gap-4 px-4 py-3 min-h-[72px]">
          <IconChip icon={Moon} color="hsl(var(--foreground))" tint="hsl(var(--muted))" />
          <span className="flex-1 font-medium text-foreground" id="tema-label">Tema escuro</span>
          <button role="switch" aria-checked={dark} aria-labelledby="tema-label" onClick={toggleTema}
            className={`h-8 w-[52px] rounded-full p-1 flex transition-colors duration-150 ${dark ? 'bg-primary' : 'bg-foreground/20'}`}>
            <span className={`block h-6 w-6 rounded-full bg-white transition-transform duration-150 ${dark ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <button onClick={sair} className="mt-6 flex items-center gap-3 min-h-[44px] font-medium text-destructive hover:underline underline-offset-4">
        <LogOut className="h-5 w-5" strokeWidth={1.75} /> Sair da conta
      </button>
    </AppScreen>
  )
}

function Row({ href, icon, t, d }: { href: string; icon: any; t: string; d: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-4 py-3 min-h-[72px] border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
      <IconChip icon={icon} color="hsl(var(--foreground))" tint="hsl(var(--muted))" />
      <span className="flex-1">
        <span className="block font-medium text-foreground">{t}</span>
        <span className="block text-sm text-muted-foreground">{d}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
    </Link>
  )
}
