-- ============================================================
-- 004 — Planejamento mensal de treinos
-- Cada treino pertence a um mês do ano (mes_referencia = 1º dia do mês).
-- O aluno vê os treinos do mês atual; no fim do ano dá para comparar
-- a evolução mês a mês. Rode no SQL Editor do Supabase (pode repetir).
-- ============================================================

ALTER TABLE public.treinos
  ADD COLUMN IF NOT EXISTS mes_referencia DATE;

-- Treinos que já existem passam a pertencer ao mês em que foram atribuídos
UPDATE public.treinos
SET mes_referencia = date_trunc('month', data_atribuicao)::date
WHERE mes_referencia IS NULL;

ALTER TABLE public.treinos
  ALTER COLUMN mes_referencia SET DEFAULT date_trunc('month', CURRENT_DATE)::date,
  ALTER COLUMN mes_referencia SET NOT NULL;

-- Garante que sempre é o 1º dia do mês
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treinos_mes_referencia_dia1') THEN
    ALTER TABLE public.treinos
      ADD CONSTRAINT treinos_mes_referencia_dia1 CHECK (EXTRACT(DAY FROM mes_referencia) = 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_treinos_user_mes ON public.treinos(user_id, mes_referencia);

-- Consulta anual das cargas registradas
CREATE INDEX IF NOT EXISTS idx_progressao_user_data
  ON public.progressao_exercicios(user_id, data_registro);
