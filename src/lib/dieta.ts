import type { Alimento, DietaRefeicao } from '@/types'

export interface Macros { kcal: number; proteina: number; carbo: number; gordura: number }

export const ZERO: Macros = { kcal: 0, proteina: 0, carbo: 0, gordura: 0 }

export function macrosAlimentos(alimentos: Alimento[] = []): Macros {
  return alimentos.reduce<Macros>((acc, a) => ({
    kcal: acc.kcal + (Number(a.kcal) || 0),
    proteina: acc.proteina + (Number(a.proteina) || 0),
    carbo: acc.carbo + (Number(a.carbo) || 0),
    gordura: acc.gordura + (Number(a.gordura) || 0),
  }), { ...ZERO })
}

export function somaMacros(refeicoes: DietaRefeicao[]): Macros {
  return refeicoes.reduce<Macros>((acc, r) => {
    const m = macrosAlimentos(r.alimentos)
    return { kcal: acc.kcal + m.kcal, proteina: acc.proteina + m.proteina, carbo: acc.carbo + m.carbo, gordura: acc.gordura + m.gordura }
  }, { ...ZERO })
}

export function round(n: number) { return Math.round(n) }

export function ordenarRefeicoes(list: DietaRefeicao[]): DietaRefeicao[] {
  return [...list].sort((a, b) =>
    (a.horario ?? '99:99').localeCompare(b.horario ?? '99:99') || a.ordem - b.ordem)
}
