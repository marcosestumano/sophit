import { addMonths, format } from 'date-fns'
import { parseKey } from '@/lib/dates'

/**
 * Planejamento mensal de treinos.
 * Um "mês" é sempre a chave 'yyyy-MM-01' (mesma forma da coluna treinos.mes_referencia).
 */

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface TreinoMensal {
  id: string
  titulo: string
  data_atribuicao: string
  mes_referencia?: string | null
  ativo?: boolean
}

/** Chave do mês de uma data (local). */
export function mesKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-01')
}

/** Chave a partir de ano e mês (1–12). */
export function mesKeyDe(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

/** Normaliza 'yyyy-MM' ou 'yyyy-MM-dd' para 'yyyy-MM-01'. */
export function normalizaMes(v: string | null | undefined): string | null {
  if (!v || !/^\d{4}-\d{2}/.test(v)) return null
  return `${v.slice(0, 7)}-01`
}

export function somaMes(key: string, n: number): string {
  return mesKey(addMonths(parseKey(key), n))
}

export function anoDe(key: string): number { return Number(key.slice(0, 4)) }
export function mesDe(key: string): number { return Number(key.slice(5, 7)) }
export function nomeMes(key: string): string { return MESES[mesDe(key) - 1] }
export function nomeMesAno(key: string): string { return `${nomeMes(key)} ${anoDe(key)}` }

/** Mês a que o treino pertence (sem a migration 004, cai na data de atribuição). */
export function mesDoTreino(t: Pick<TreinoMensal, 'mes_referencia' | 'data_atribuicao'>): string {
  return normalizaMes(t.mes_referencia) ?? normalizaMes(t.data_atribuicao) ?? mesKey()
}

/**
 * Plano que o aluno segue agora: os treinos do mês atual.
 * Se o mês atual ainda não foi montado, continua valendo o mês mais recente
 * (o aluno nunca fica sem treino). Meses futuros não aparecem para o aluno.
 */
export function planoDoAluno<T extends TreinoMensal>(treinos: T[], hoje: string = mesKey()) {
  const meses = Array.from(new Set(treinos.map(mesDoTreino))).filter(m => m <= hoje).sort()
  const mes = meses.includes(hoje) ? hoje : meses[meses.length - 1] ?? null
  return {
    mes,
    doMesAtual: mes === hoje,
    atuais: mes ? treinos.filter(t => mesDoTreino(t) === mes) : [],
    anteriores: treinos.filter(t => { const m = mesDoTreino(t); return m !== mes && m <= hoje }),
  }
}

// ── Evolução anual ─────────────────────────────────────────

export interface RegistroCarga {
  treino_id: string | null
  exercicio_nome: string
  carga: number | string | null
  data_registro: string
}

export interface MesResumo {
  key: string
  mes: number
  treinosNoPlano: number
  diasTreinados: number
  registros: number
}

export interface ExercicioEvolucao {
  nome: string
  porMes: (number | null)[]   // carga máxima em cada mês (índice 0 = janeiro)
  primeira: number
  ultima: number
  ganho: number
  ganhoPct: number | null
  mesesComRegistro: number
}

const normNome = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * @param diasPreparo datas ('yyyy-MM-dd') em que o aluno marcou mobilidade/ativação;
 *                    contam como dia treinado mesmo sem carga registrada.
 */
export function evolucaoAnual(registros: RegistroCarga[], treinos: TreinoMensal[], ano: number, diasPreparo: string[] = []) {
  const doAno = registros.filter(r => r.data_registro?.startsWith(`${ano}-`))
  const preparoDoAno = diasPreparo.filter(d => d.startsWith(`${ano}-`))

  const meses: MesResumo[] = Array.from({ length: 12 }, (_, i) => {
    const key = mesKeyDe(ano, i + 1)
    const prefixo = key.slice(0, 7)
    const regs = doAno.filter(r => r.data_registro.startsWith(prefixo))
    return {
      key,
      mes: i + 1,
      treinosNoPlano: treinos.filter(t => mesDoTreino(t) === key).length,
      diasTreinados: new Set([...regs.map(r => r.data_registro), ...preparoDoAno.filter(d => d.startsWith(prefixo))]).size,
      registros: regs.length,
    }
  })

  const porExercicio = new Map<string, { nome: string; porMes: (number | null)[] }>()
  for (const r of [...doAno].sort((a, b) => a.data_registro.localeCompare(b.data_registro))) {
    const carga = Number(r.carga)
    if (!r.exercicio_nome || !Number.isFinite(carga) || carga <= 0) continue
    const k = normNome(r.exercicio_nome)
    const item = porExercicio.get(k) ?? { nome: r.exercicio_nome.trim(), porMes: Array(12).fill(null) }
    item.nome = r.exercicio_nome.trim() // fica com a grafia mais recente
    const m = Number(r.data_registro.slice(5, 7)) - 1
    item.porMes[m] = Math.max(item.porMes[m] ?? 0, carga)
    porExercicio.set(k, item)
  }

  const exercicios: ExercicioEvolucao[] = Array.from(porExercicio.values()).map(e => {
    const valores = e.porMes.filter((v): v is number => v !== null)
    const primeira = valores[0]
    const ultima = valores[valores.length - 1]
    const ganho = Math.round((ultima - primeira) * 10) / 10
    return {
      ...e, primeira, ultima, ganho,
      ganhoPct: primeira > 0 ? Math.round(((ultima - primeira) / primeira) * 100) : null,
      mesesComRegistro: valores.length,
    }
  }).sort((a, b) =>
    (b.mesesComRegistro > 1 ? 1 : 0) - (a.mesesComRegistro > 1 ? 1 : 0)
    || (b.ganhoPct ?? -Infinity) - (a.ganhoPct ?? -Infinity)
    || a.nome.localeCompare(b.nome))

  const comparaveis = exercicios.filter(e => e.mesesComRegistro > 1)
  return {
    meses,
    exercicios,
    resumo: {
      diasTreinados: new Set([...doAno.map(r => r.data_registro), ...preparoDoAno]).size,
      mesesComPlano: meses.filter(m => m.treinosNoPlano > 0).length,
      mesesTreinados: meses.filter(m => m.diasTreinados > 0).length,
      exerciciosEvoluindo: comparaveis.filter(e => e.ganho > 0).length,
      exerciciosComparaveis: comparaveis.length,
    },
  }
}
