-- ============================================================
-- 007: Corrige exclusão de usuários
--   1) "Database error loading user": usuários criados via SQL
--      ficam com colunas de token NULL que o GoTrue não consegue ler.
--   2) FKs sem ON DELETE que bloqueariam o delete em cascata.
-- ============================================================

-- 1) Normaliza colunas de token NULL em auth.users
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR reauthentication_token IS NULL;

-- 2a) treinos.admin_id: ao deletar o admin, mantém o treino do aluno
ALTER TABLE public.treinos ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.treinos DROP CONSTRAINT IF EXISTS treinos_admin_id_fkey;
ALTER TABLE public.treinos
  ADD CONSTRAINT treinos_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2b) dieta_refeicoes.criado_por
ALTER TABLE public.dieta_refeicoes DROP CONSTRAINT IF EXISTS dieta_refeicoes_criado_por_fkey;
ALTER TABLE public.dieta_refeicoes
  ADD CONSTRAINT dieta_refeicoes_criado_por_fkey
  FOREIGN KEY (criado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;
