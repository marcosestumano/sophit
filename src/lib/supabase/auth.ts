import { cache } from 'react'
import { createClient } from './server'

/**
 * Usuário logado para Server Components.
 *
 * Usa getClaims(): com as chaves assimétricas do Supabase o token é verificado
 * localmente, sem ida ao servidor de Auth a cada troca de tela (getUser() fazia
 * essa ida em toda página). Se o projeto usar chave simétrica, o próprio
 * getClaims() cai para a verificação no servidor, então continua seguro.
 *
 * `cache` faz layout e página do mesmo request compartilharem uma única checagem.
 * As consultas ao banco continuam protegidas pelo RLS com o mesmo token.
 */
export const getAuthUser = cache(async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  return { id: data.claims.sub as string, email: (data.claims.email as string | undefined) ?? null }
})
