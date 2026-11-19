-- Ordem manual dos treinos (drag & drop no painel admin)
ALTER TABLE public.treinos ADD COLUMN IF NOT EXISTS ordem INTEGER;

-- Preenche a ordem atual dos treinos existentes (por aluno)
WITH numerados AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY data_atribuicao, titulo) - 1 AS pos
  FROM public.treinos
)
UPDATE public.treinos t
SET ordem = n.pos
FROM numerados n
WHERE t.id = n.id AND t.ordem IS NULL;

CREATE INDEX IF NOT EXISTS idx_treinos_user_ordem ON public.treinos(user_id, ordem);
 