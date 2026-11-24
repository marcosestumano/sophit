import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarPushParaUsuario } from '@/lib/push-server'

/** Só admin: envia um push de teste para os próprios aparelhos. Serve para diagnosticar a entrega. */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const resultado = await enviarPushParaUsuario(user.id, {
    title: 'Teste do Sophit',
    body: 'Se você está vendo isto, os avisos de treino estão funcionando.',
    url: '/dashboard/perfil',
    tag: 'teste',
  })
  return NextResponse.json(resultado)
}
