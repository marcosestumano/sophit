import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarPushParaUsuario } from '@/lib/push-server'

/**
 * Chamada pelo painel admin depois de criar/editar treinos de um aluno.
 * Body: { userId, tipo: 'novo' | 'editado' | 'plano', titulo?, quantidade?, treinoId? }
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { userId, tipo, titulo, quantidade, treinoId } = await request.json().catch(() => ({}))
  if (typeof userId !== 'string') return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ ok: true, enviados: 0, motivo: 'treino próprio' })

  const nome = typeof titulo === 'string' && titulo.trim() ? `“${titulo.trim().slice(0, 60)}”` : ''
  const msg =
    tipo === 'novo'   ? { title: 'Treino novo no Sophit', body: `${nome || 'Um treino novo'} já está disponível. Toque para ver.` } :
    tipo === 'plano'  ? { title: 'Treinos do mês prontos', body: `${quantidade ?? 'Seus'} treinos do mês foram liberados. Toque para ver.` } :
                        { title: 'Seu treino foi atualizado', body: `${nome ? `O treino ${nome}` : 'Seu treino'} teve ajustes. Confira antes de treinar.` }

  const resultado = await enviarPushParaUsuario(userId, {
    ...msg,
    url: '/dashboard/treinos',
    tag: treinoId ? `treino-${treinoId}` : 'treinos',
  })
  return NextResponse.json({ ok: true, ...resultado })
}
