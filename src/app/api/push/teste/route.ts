import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarPushParaUsuario } from '@/lib/push-server'

/** Envia um push de teste para os aparelhos de quem está logado. Serve para diagnosticar a entrega. */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const resultado = await enviarPushParaUsuario(user.id, {
    title: 'Teste do Sophit',
    body: 'Se você está vendo isto, os avisos de treino estão funcionando.',
    url: '/dashboard/perfil',
    tag: 'teste',
  })
  return NextResponse.json(resultado)
}
