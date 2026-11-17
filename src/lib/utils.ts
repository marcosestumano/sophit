import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ordena treinos pela ordem manual (coluna `ordem`); sem ordem vão para o fim. */
export function sortTreinos<T extends { ordem?: number | null; data_atribuicao: string; titulo: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const oa = a.ordem ?? Number.MAX_SAFE_INTEGER
    const ob = b.ordem ?? Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    if (a.data_atribuicao !== b.data_atribuicao) return a.data_atribuicao < b.data_atribuicao ? -1 : 1
    return a.titulo.localeCompare(b.titulo)
  })
}
