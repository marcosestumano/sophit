-- ============================================================
-- 003b — Tabelas que existiam só no painel do Supabase
-- progressao_exercicios (cargas registradas pelo aluno),
-- fotos_progresso (antes/depois), treino_templates (biblioteca do admin)
-- e o bucket de storage progress-photos.
--
-- Rode DEPOIS da 003 e ANTES da 004 (a 004 cria índice em
-- progressao_exercicios). Pode repetir: em um banco que já tem essas
-- tabelas, nada é alterado além das políticas de RLS, que são recriadas.
-- ============================================================

-- ── PROGRESSÃO DE CARGA ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progressao_exercicios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  treino_id       UUID NOT NULL REFERENCES public.treinos(id)  ON DELETE CASCADE,
  exercicio_nome  TEXT NOT NULL,
  carga           NUMERIC(6,2) NOT NULL,
  series          INTEGER,
  reps            TEXT,
  observacoes     TEXT,
  data_registro   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progressao_treino_exercicio
  ON public.progressao_exercicios(user_id, treino_id, exercicio_nome);

-- ── FOTOS DE PROGRESSO ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fotos_progresso (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('antes', 'depois')),
  url           TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  descricao     TEXT,
  data_foto     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fotos_progresso_user_data
  ON public.fotos_progresso(user_id, data_foto);

-- ── BIBLIOTECA DE TEMPLATES DE TREINO ───────────────────────
CREATE TABLE IF NOT EXISTS public.treino_templates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  lista_exercicios  JSONB NOT NULL DEFAULT '[]'::jsonb,
  categoria         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.progressao_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_progresso       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_templates      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progressao_own"         ON public.progressao_exercicios;
DROP POLICY IF EXISTS "fotos_progresso_own"    ON public.fotos_progresso;
DROP POLICY IF EXISTS "treino_templates_admin" ON public.treino_templates;

-- Aluno registra/lê as próprias cargas; admin vê/edita todas
CREATE POLICY "progressao_own" ON public.progressao_exercicios FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Fotos: aluno e admin podem enviar/ver/apagar
CREATE POLICY "fotos_progresso_own" ON public.fotos_progresso FOR ALL
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Templates: só profissionais
CREATE POLICY "treino_templates_admin" ON public.treino_templates FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ── STORAGE: progress-photos ────────────────────────────────
-- Público para leitura (o app usa getPublicUrl). Arquivos ficam em <user_id>/...
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "progress_photos_read"   ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_delete" ON storage.objects;

CREATE POLICY "progress_photos_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos');

CREATE POLICY "progress_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.get_user_role() = 'admin')
  );

CREATE POLICY "progress_photos_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.get_user_role() = 'admin')
  );
