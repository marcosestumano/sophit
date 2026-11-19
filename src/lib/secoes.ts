/**
 * Blocos do treino (livres): o profissional cria quantos quiser, dá o título e escolhe o tipo.
 *  - 'carga'   → o aluno registra carga em cada exercício (entra na progressão/evolução)
 *  - 'preparo' → o aluno só marca como feito (mobilidade, ativação, alongamento...)
 *
 * No banco, treinos.lista_exercicios continua uma lista simples; cada exercício leva
 * bloco_id, bloco (título) e bloco_tipo. A ordem dos blocos é a ordem em que aparecem.
 * Exercícios antigos usam `secao` (mobilidade/ativacao/treino) e são convertidos aqui.
 */

export type TipoBloco = 'preparo' | 'carga'

export interface ExercicioForm {
  nome: string
  series: number
  reps: string
  carga?: string
  observacoes?: string
}

export interface ExercicioSalvo extends ExercicioForm {
  bloco_id?: string
  bloco?: string
  bloco_tipo?: TipoBloco
  /** legado (antes dos blocos livres) */
  secao?: string
}

export interface BlocoForm {
  id: string
  titulo: string
  tipo: TipoBloco
  exercicios: ExercicioForm[]
}

export interface InfoBloco { id: string; titulo: string; tipo: TipoBloco }

const LEGADO: Record<string, InfoBloco> = {
  mobilidade: { id: 'mobilidade', titulo: 'Mobilidade', tipo: 'preparo' },
  ativacao: { id: 'ativacao', titulo: 'Ativação', tipo: 'preparo' },
  treino: { id: 'treino', titulo: 'Treino', tipo: 'carga' },
}

/** Sugestões rápidas ao criar um bloco. */
export const SUGESTOES_BLOCO: { titulo: string; tipo: TipoBloco }[] = [
  { titulo: 'Mobilidade', tipo: 'preparo' },
  { titulo: 'Ativação', tipo: 'preparo' },
  { titulo: 'Aquecimento', tipo: 'preparo' },
  { titulo: 'Treino', tipo: 'carga' },
  { titulo: 'Core', tipo: 'carga' },
  { titulo: 'Alongamento', tipo: 'preparo' },
]

export function novoId(): string {
  return 'b' + Math.random().toString(36).slice(2, 10)
}

export function infoBloco(ex: Partial<ExercicioSalvo>): InfoBloco {
  if (ex.bloco_id) {
    return { id: ex.bloco_id, titulo: ex.bloco?.trim() || 'Bloco', tipo: ex.bloco_tipo === 'preparo' ? 'preparo' : 'carga' }
  }
  return LEGADO[ex.secao === 'mobilidade' || ex.secao === 'ativacao' ? ex.secao : 'treino']
}

export function registraCarga(ex: Partial<ExercicioSalvo>): boolean {
  return infoBloco(ex).tipo === 'carga'
}

/** Agrupa por bloco na ordem em que aparecem, guardando o índice original de cada exercício. */
export function agruparBlocos<T extends Partial<ExercicioSalvo>>(lista: T[]) {
  const grupos: (InfoBloco & { itens: { item: T; index: number }[] })[] = []
  lista.forEach((item, index) => {
    const info = infoBloco(item)
    let g = grupos.find(x => x.id === info.id)
    if (!g) { g = { ...info, itens: [] }; grupos.push(g) }
    g.itens.push({ item, index })
  })
  return grupos
}

const limparExercicio = ({ nome, series, reps, carga, observacoes }: ExercicioSalvo): ExercicioForm =>
  ({ nome, series: Number(series) || 1, reps: reps ?? '', carga: carga ?? '', observacoes: observacoes ?? '' })

/** Lista salva → blocos do formulário. */
export function listaParaBlocos(lista: ExercicioSalvo[] | null | undefined): BlocoForm[] {
  return agruparBlocos(lista ?? []).map(g => ({
    id: g.id, titulo: g.titulo, tipo: g.tipo,
    exercicios: g.itens.map(({ item }) => limparExercicio(item)),
  }))
}

/** Blocos do formulário → lista salva (blocos vazios são descartados). */
export function blocosParaLista(blocos: BlocoForm[]): ExercicioSalvo[] {
  return blocos.filter(b => b.exercicios.length > 0).flatMap(b =>
    b.exercicios.map(e => ({ ...limparExercicio(e), bloco_id: b.id, bloco: b.titulo.trim(), bloco_tipo: b.tipo })))
}

export function novoExercicio(tipo: TipoBloco): ExercicioForm {
  return tipo === 'carga'
    ? { nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }
    : { nome: '', series: 2, reps: '30s', carga: '', observacoes: '' }
}

export function novoBloco(titulo: string, tipo: TipoBloco, comExercicio = true): BlocoForm {
  return { id: novoId(), titulo, tipo, exercicios: comExercicio ? [novoExercicio(tipo)] : [] }
}

export function blocosPadrao(): BlocoForm[] {
  return [novoBloco('Mobilidade', 'preparo'), novoBloco('Treino', 'carga')]
}

/** Chave do check diário de um exercício de preparo (treino_checks.secao guarda o id do bloco). */
export function chaveCheck(ex: Partial<ExercicioSalvo>): string {
  return `${infoBloco(ex).id}|${ex.nome}`
}

/**
 * Junta registros de carga e checks de preparo numa lista única
 * { treino_id, data_registro }, mais recente primeiro (formato usado na Home e em Meus treinos).
 */
export function juntarAtividade(
  progressoes: { treino_id: string; data_registro: string }[],
  checks: { treino_id: string; data: string }[],
) {
  return [...progressoes, ...checks.map(c => ({ treino_id: c.treino_id, data_registro: c.data }))]
    .sort((a, b) => b.data_registro.localeCompare(a.data_registro))
}
