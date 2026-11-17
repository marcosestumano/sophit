-- ============================================================
-- 003 — Dieta (planos + refeições + checks) e Cardio (prescrição + registros)
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez com segurança.
-- ============================================================

-- ── PLANO ALIMENTAR (1 ativo por aluno) ─────────────────────
CREATE TABLE IF NOT EXISTS public.dieta_planos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL DEFAULT 'Plano alimentar',
  meta_kcal        INTEGER,
  meta_proteina    INTEGER,
  meta_carbo       INTEGER,
  meta_gordura     INTEGER,
  agua_litros      NUMERIC(4,1),
  dias_semana      TEXT NOT NULL DEFAULT 'Todos os dias',
  prescricao       TEXT,          -- ex: suplementação
  observacoes      TEXT,
  refeicao_livre   TEXT,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REFEIÇÕES DO PLANO ──────────────────────────────────────
-- alimentos: [{"nome":"Pão francês","quantidade":"1 un","kcal":135,"proteina":4,"carbo":28,"gordura":1}]
CREATE TABLE IF NOT EXISTS public.dieta_refeicoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_id    UUID NOT NULL REFERENCES public.dieta_planos(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  horario     TEXT,             -- "07:00"
  alimentos   JSONB NOT NULL DEFAULT '[]',
  observacoes TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_por  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHECK DIÁRIO DAS REFEIÇÕES ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.dieta_checks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refeicao_id  UUID NOT NULL REFERENCES public.dieta_refeicoes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (refeicao_id, data)
);

-- ── CARDIO PRESCRITO PELO ADMIN ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.cardio_prescricoes (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo               TEXT NOT NULL,         -- Esteira, Bike, Caminhada...
  duracao_min        INTEGER,
  frequencia_semana  INTEGER,               -- vezes por semana
  intensidade        TEXT,                  -- Leve / Moderada / Intensa / HIIT
  observacoes        TEXT,
  ativo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CARDIOS FEITOS (registrados pelo aluno) ─────────────────
CREATE TABLE IF NOT EXISTS public.cardio_registros (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prescricao_id  UUID REFERENCES public.cardio_prescricoes(id) ON DELETE SET NULL,
  data           DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo           TEXT NOT NULL,
  duracao_min    INTEGER,
  distancia_km   NUMERIC(6,2),
  calorias       INTEGER,
  intensidade    TEXT,
  observacoes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dieta_planos_user      ON public.dieta_planos(user_id);
CREATE INDEX IF NOT EXISTS idx_dieta_refeicoes_plano  ON public.dieta_refeicoes(plano_id);
CREATE INDEX IF NOT EXISTS idx_dieta_checks_user_data ON public.dieta_checks(user_id, data);
CREATE INDEX IF NOT EXISTS idx_cardio_presc_user      ON public.cardio_prescricoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cardio_reg_user_data   ON public.cardio_registros(user_id, data);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.dieta_planos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_refeicoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_checks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_prescricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_registros   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dieta_planos_own"     ON public.dieta_planos;
DROP POLICY IF EXISTS "dieta_refeicoes_own"  ON public.dieta_refeicoes;
DROP POLICY IF EXISTS "dieta_checks_own"     ON public.dieta_checks;
DROP POLICY IF EXISTS "cardio_presc_select"  ON public.cardio_prescricoes;
DROP POLICY IF EXISTS "cardio_presc_admin"   ON public.cardio_prescricoes;
DROP POLICY IF EXISTS "cardio_reg_own"       ON public.cardio_registros;

-- Dieta: aluno e admin podem ler e editar ("os dois cadastram")
CREATE POLICY "dieta_planos_own" ON public.dieta_planos FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

CREATE POLICY "dieta_refeicoes_own" ON public.dieta_refeicoes FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

CREATE POLICY "dieta_checks_own" ON public.dieta_checks FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Cardio prescrito: aluno só lê, admin faz tudo
CREATE POLICY "cardio_presc_select" ON public.cardio_prescricoes FOR SELECT
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin');
CREATE POLICY "cardio_presc_admin" ON public.cardio_prescricoes FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Cardio feito: aluno registra os seus, admin vê/edita todos
CREATE POLICY "cardio_reg_own" ON public.cardio_registros FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Aluno passa a poder LER as próprias avaliações físicas (peso na Home)
DROP POLICY IF EXISTS "users_select_own_avaliacoes" ON public.avaliacoes_fisicas;
CREATE POLICY "users_select_own_avaliacoes" ON public.avaliacoes_fisicas FOR SELECT
  USING (auth.uid() = user_id);
