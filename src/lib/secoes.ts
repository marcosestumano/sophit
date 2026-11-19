/**
 * Blocos do treino: Mobilidade → Ativação (opcional) → Treino.
 * Cada exercício guarda a seção em lista_exercicios[].secao (JSONB, sem migration).
 * Exercícios antigos, sem seção, contam como "treino".
 */

export type Secao = 'mobilidade' | 'ativacao' | 'treino'

export const SECOES: { id: Secao; nome: string; opcional: boolean; descricao: string; repsLabel: string; repsPlaceholder: string; exemplo: string }[] = [
  { id: 'mobilidade', nome: 'Mobilidade', opcional: false, descricao: 'Preparar articulações e amplitude', repsLabel: 'Reps / tempo', repsPlaceholder: 'Ex: 10 ou 30s', exemplo: 'Ex: Mobilidade de quadril 90/90' },
  { id: 'ativacao', nome: 'Ativação', opcional: true, descricao: 'Se tiver: ativar os músculos do dia', repsLabel: 'Reps / tempo', repsPlaceholder: 'Ex: 15 ou 30s', exemplo: 'Ex: Ponte de glúteo com miniband' },
  { id: 'treino', nome: 'Treino', opcional: false, descricao: 'Parte principal, com registro de carga', repsLabel: 'Repetições', repsPlaceholder: 'Ex: 10-12', exemplo: 'Ex: Supino reto com barra' },
]

export const ORDEM_SECAO: Record<Secao, number> = { mobilidade: 0, ativacao: 1, treino: 2 }

export function secaoDe(ex: { secao?: string | null }): Secao {
  return ex.secao === 'mobilidade' || ex.secao === 'ativacao' ? ex.secao : 'treino'
}

/** Ordena mantendo a ordem interna de cada bloco (sort estável). */
export function ordenarPorSecao<T extends { secao?: string | null }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => ORDEM_SECAO[secaoDe(a)] - ORDEM_SECAO[secaoDe(b)])
}

/** Agrupa preservando o índice original (necessário para o react-hook-form). */
export function agruparPorSecao<T extends { secao?: string | null }>(lista: T[]) {
  return SECOES.map(s => ({
    ...s,
    itens: lista.map((item, index) => ({ item, index })).filter(({ item }) => secaoDe(item) === s.id),
  }))
}

export function novoExercicio(secao: Secao) {
  return secao === 'treino'
    ? { nome: '', series: 3, reps: '10-12', carga: '', observacoes: '', secao }
    : { nome: '', series: 2, reps: secao === 'mobilidade' ? '30s' : '15', carga: '', observacoes: '', secao }
}

/**
 * Junta registros de carga e checks de mobilidade/ativação numa lista única
 * { treino_id, data_registro }, mais recente primeiro (formato usado na Home e em Meus treinos).
 */
export function juntarAtividade(
  progressoes: { treino_id: string; data_registro: string }[],
  checks: { treino_id: string; data: string }[],
) {
  return [...progressoes, ...checks.map(c => ({ treino_id: c.treino_id, data_registro: c.data }))]
    .sort((a, b) => b.data_registro.localeCompare(a.data_registro))
}
