import { addDays, format, startOfWeek, subDays } from 'date-fns'

/** yyyy-MM-dd no fuso local do aparelho (não usar toISOString, que é UTC). */
export function dateKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

/** Converte 'yyyy-MM-dd' em Date local (meio-dia, evita bugs de fuso). */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** 7 dias (seg → dom) da semana que contém `d`. */
export function weekDays(d: Date = new Date()): Date[] {
  const start = startOfWeek(d, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/**
 * Sequência atual de dias consecutivos que satisfazem `done`.
 * Se hoje ainda não foi feito, conta a partir de ontem (o dia não acabou).
 */
export function currentStreak(done: (key: string) => boolean, today: Date = new Date()): number {
  let day = done(dateKey(today)) ? today : subDays(today, 1)
  let n = 0
  while (done(dateKey(day)) && n < 3650) { n++; day = subDays(day, 1) }
  return n
}

/** Maior sequência dentro de um conjunto de datas. */
export function bestStreak(keys: Iterable<string>): number {
  const sorted = Array.from(new Set(keys)).sort()
  let best = 0, run = 0, prev: string | null = null
  for (const k of sorted) {
    run = prev && dateKey(addDays(parseKey(prev), 1)) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

export function letraTreino(i: number): string {
  return String.fromCharCode(65 + (i % 26))
}
