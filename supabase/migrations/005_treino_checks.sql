-- ============================================================
-- 005 — Check diário de mobilidade e ativação (blocos do treino)
-- O aluno marca cada exercício de preparo como feito no dia.
-- Conta como dia treinado e aparece para o profissional.
-- Rode no SQL Editor do Supabase (pode repetir).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.treino_checks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  treino_id       UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  secao           TEXT NOT NULL,          -- id do bloco do treino
  exercicio_nome  TEXT NOT NULL,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (treino_id, secao, exercicio_nome, data)
);

CREATE INDEX IF NOT EXISTS idx_treino_checks_user_data ON public.treino_checks(user_id, data);
CREATE INDEX IF NOT EXISTS idx_treino_checks_treino    ON public.treino_checks(treino_id, data);

ALTER TABLE public.treino_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treino_checks_own" ON public.treino_checks;
CREATE POLICY "treino_checks_own" ON public.treino_checks FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');
