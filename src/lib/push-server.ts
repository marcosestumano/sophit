// Só no servidor: envia notificações push usando as chaves VAPID.
import webpush from 'web-push'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export interface PushPayload {
  title: string
  body: string
  url?: string   // página aberta ao tocar na notificação
  tag?: string   // notificações com a mesma tag se substituem (não empilham)
}

let configurado = false
function configurar() {
  if (configurado) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@sophit.app', pub, priv)
  configurado = true
  return true
}

export function adminClient() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

/** Envia para todos os aparelhos do usuário. Remove do banco os aparelhos que não existem mais. */
export async function enviarPushParaUsuario(userId: string, payload: PushPayload) {
  if (!configurar()) return { enviados: 0, falhas: 0, motivo: 'VAPID não configurado' }

  const db = adminClient()
  const { data: subs, error } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId)
  if (error) return { enviados: 0, falhas: 0, motivo: error.message }
  if (!subs?.length) return { enviados: 0, falhas: 0, motivo: 'aluno sem notificações ativas' }

  const corpo = JSON.stringify(payload)
  const expirados: string[] = []
  let enviados = 0, falhas = 0

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        corpo,
        { TTL: 60 * 60 * 24, urgency: 'normal' },
      )
      enviados++
    } catch (err: any) {
      falhas++
      // 404/410: o aluno desinstalou, limpou os dados ou revogou a permissão
      if (err?.statusCode === 404 || err?.statusCode === 410) expirados.push(s.id)
      else console.error('[push] falha ao enviar:', err?.statusCode, err?.body || err?.message)
    }
  }))

  if (expirados.length) await db.from('push_subscriptions').delete().in('id', expirados)
  return { enviados, falhas }
}
