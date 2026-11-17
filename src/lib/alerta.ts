/** Aviso de fim de timer: vibra e toca um bipe curto (Web Audio, sem arquivo de som). */
let ctx: AudioContext | null = null

/** Chame dentro de um toque do usuário (ex.: ao iniciar o timer) para liberar o áudio no iOS. */
export function prepararAudio() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {}
}

export function alertar(vezes = 3) {
  try { navigator.vibrate?.([250, 120, 250, 120, 250]) } catch {}
  try {
    if (!ctx) return
    for (let i = 0; i < vezes; i++) {
      const t = ctx.currentTime + i * 0.28
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.22)
    }
  } catch {}
}

/** 75 → "1:15" */
export function mmss(totalSeg: number) {
  const s = Math.max(0, Math.round(totalSeg))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export function lerLocal<T>(chave: string): T | null {
  try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) as T : null } catch { return null }
}
export function gravarLocal(chave: string, valor: unknown) {
  try { valor == null ? localStorage.removeItem(chave) : localStorage.setItem(chave, JSON.stringify(valor)) } catch {}
}
