-- ============================================================
-- 006 — Blocos livres no treino
-- Os blocos deixam de ser fixos (mobilidade/ativação/treino): o profissional
-- cria quantos quiser e dá o título. treino_checks.secao passa a guardar o id
-- do bloco, então a restrição antiga sai. Rode depois da 005 (pode repetir).
-- ============================================================

ALTER TABLE public.treino_checks DROP CONSTRAINT IF EXISTS treino_checks_secao_check;

COMMENT ON COLUMN public.treino_checks.secao IS
  'Id do bloco do treino (lista_exercicios[].bloco_id). Legado: mobilidade / ativacao.';
