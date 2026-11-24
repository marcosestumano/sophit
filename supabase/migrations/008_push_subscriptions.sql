-- ============================================================
-- 008 — Notificações push
-- Cada aparelho/navegador em que o aluno ativa os avisos vira
-- uma linha aqui. O servidor usa essas linhas para enviar o push
-- quando o treino é criado ou atualizado.
-- Rode no SQL Editor do Supabase (pode repetir).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,      -- endereço único do aparelho no serviço de push
  p256dh      TEXT NOT NULL,             -- chave pública do navegador (criptografia)
  auth        TEXT NOT NULL,             -- segredo do navegador (criptografia)
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- O aluno só enxerga/apaga os próprios aparelhos.
-- A gravação e o envio passam pelas rotas /api/push/* com a service role.
DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
