import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/push-server'

/** Salva (ou move para o usuário atual) a inscrição de push deste aparelho. */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sub = await request.json().catch(() => null)
  const endpoint = sub?.endpoint, p256dh = sub?.keys?.p256dh, auth = sub?.keys?.auth
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !p256dh || !auth) {
    return NextResponse.json({ error: 'Inscrição inválida' }, { status: 400 })
  }

  // Service role: se outra pessoa já usou este aparelho, a inscrição passa a ser de quem está logado agora
  const { error } = await adminClient().from('push_subscriptions').upsert({
    user_id: user.id, endpoint, p256dh, auth,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Remove a inscrição deste aparelho (desativar avisos ou sair da conta). */
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { endpoint } = await request.json().catch(() => ({}))
  if (typeof endpoint !== 'string') return NextResponse.json({ error: 'endpoint é obrigatório' }, { status: 400 })

  await adminClient().from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
