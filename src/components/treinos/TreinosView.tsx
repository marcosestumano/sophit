'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Dumbbell, Play, ChevronDown, ChevronRight, Check, Timer, BarChart3 } from 'lucide-react'
import { useDescanso } from '@/components/treinos/Descanso'
import { AppScreen, ScreenHeader } from '@/components/app/AppShell'
import { ProgressaoExercicio } from '@/components/dashboard/ProgressaoExercicio'
import { dateKey, letraTreino, parseKey } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { agruparBlocos, chaveCheck, infoBloco, numeroBloco } from '@/lib/secoes'
import { createClient } from '@/lib/supabase/client'
import { planoDoAluno, mesDoTreino, nomeMes, nomeMesAno } from '@/lib/periodizacao'

interface Treino {
  id: string; titulo: string; descricao: string | null; lista_exercicios: any[]
  data_atribuicao: string; ativo: boolean; mes_referencia?: string | null
}

interface Props {
  userId: string
  treinos: Treino[]
  progressoes: { treino_id: string; data_registro: string }[]
  abrirId: string | null
}

export function TreinosView({ userId, treinos, progressoes, abrirId }: Props) {
  // Plano do mês: treinos do mês atual (ou do último mês montado, se o atual ainda não foi)
  const plano = planoDoAluno(treinos)
  const ativos = plano.atuais.filter(t => t.ativo)
  const inativos = [...plano.atuais.filter(t => !t.ativo), ...plano.anteriores]
  // Agrupa os anteriores por mês, do mais recente para o mais antigo
  const gruposAnteriores = Array.from(new Set(inativos.map(mesDoTreino))).sort().reverse()
    .map(mes => ({ mes, treinos: inativos.filter(t => mesDoTreino(t) === mes) }))
  const subtitulo = plano.mes
    ? `Plano de ${nomeMes(plano.mes).toLowerCase()} · ${ativos.length} treino${ativos.length !== 1 ? 's' : ''}`
      + (plano.doMesAtual ? '' : ' · o novo mês ainda não foi montado')
    : 'Nenhum treino no plano'
  const today = dateKey()

  // Próximo da rotação: o seguinte ao último treinado
  const ultimo = progressoes.find(p => ativos.some(t => t.id === p.treino_id))
  const ultimoIdx = ultimo ? ativos.findIndex(t => t.id === ultimo.treino_id) : -1
  const proximoId = ativos.length ? ativos[(ultimoIdx + 1) % ativos.length].id : null
  const feitosHoje = new Set(progressoes.filter(p => p.data_registro === today).map(p => p.treino_id))

  const ultimaData = (id: string) => progressoes.find(p => p.treino_id === id)?.data_registro

  const descanso = useDescanso()
  const [aberto, setAberto] = useState<string | null>(abrirId)
  const [verHistorico, setVerHistorico] = useState(false)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (abrirId) refs.current[abrirId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [abrirId])

  return (
    <AppScreen>
      <ScreenHeader title="Meus treinos" sub={subtitulo} right={
        <Link href="/dashboard/treinos/evolucao"
          className="press h-11 px-4 rounded-full border border-border flex items-center gap-2 text-sm font-medium text-foreground hover:bg-muted">
          <BarChart3 className="h-4 w-4" strokeWidth={1.75} /> Evolução no ano
        </Link>
      } />

      {ativos.length === 0 && (
        <div className="app-card p-8 mt-4 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" strokeWidth={1.5} />
          <p className="font-medium text-foreground">Nenhum treino ainda</p>
          <p className="text-muted-foreground mt-1">Seu profissional monta os treinos e eles aparecem aqui.</p>
        </div>
      )}

      <div className="space-y-3 mt-2">
        {ativos.map((t, i) => (
          <div key={t.id} ref={el => { refs.current[t.id] = el }} className="scroll-mt-4">
            <TreinoItem
              treino={t} letra={letraTreino(i)} userId={userId}
              destaque={t.id === proximoId && !feitosHoje.has(t.id)}
              feitoHoje={feitosHoje.has(t.id)}
              ultima={ultimaData(t.id)}
              aberto={aberto === t.id}
              onToggle={() => setAberto(aberto === t.id ? null : t.id)}
            />
          </div>
        ))}
      </div>

      {inativos.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setVerHistorico(v => !v)} aria-expanded={verHistorico}
            className="link-rose flex items-center gap-2 min-h-[44px]">
            Treinos anteriores ({inativos.length})
            <ChevronDown className={cn('h-[18px] w-[18px] transition-transform duration-150', verHistorico && 'rotate-180')} strokeWidth={1.75} />
          </button>
          {verHistorico && (
            <div className="space-y-5 mt-2">
              {gruposAnteriores.map(g => (
                <div key={g.mes} className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground px-1">{nomeMesAno(g.mes)}</p>
                  {g.treinos.map(t => (
                    <TreinoItem key={t.id} treino={t} letra="·" userId={userId} destaque={false} feitoHoje={false}
                      ultima={ultimaData(t.id)} aberto={aberto === t.id} onToggle={() => setAberto(aberto === t.id ? null : t.id)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* folga para a barra flutuante do descanso não cobrir o último exercício */}
      {descanso.ativo && <div className="h-24" aria-hidden="true" />}
    </AppScreen>
  )
}

function TreinoItem({ treino, letra, userId, destaque, feitoHoje, ultima, aberto, onToggle }: {
  treino: Treino; letra: string; userId: string; destaque: boolean; feitoHoje: boolean
  ultima?: string; aberto: boolean; onToggle: () => void
}) {
  const descanso = useDescanso()
  const ex = treino.lista_exercicios ?? []
  const meta = `${ex.length} exercício${ex.length !== 1 ? 's' : ''} · ${ultima ? `último em ${format(parseKey(ultima), "d 'de' MMM", { locale: ptBR })}` : 'ainda não registrado'}`

  if (destaque && !aberto) {
    return (
      <div className="app-card p-5 border-2 border-primary">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl">{letra}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Próximo · {ex.length} exercícios</p>
            <p className="text-[28px] leading-tight tracking-[-0.02em] text-foreground truncate">{treino.titulo}</p>
          </div>
        </div>
        <p className="mt-3 mb-4 text-muted-foreground">
          {ultima ? `Último registro em ${format(parseKey(ultima), "d 'de' MMMM", { locale: ptBR })}.` : 'Primeira vez com este treino.'}
        </p>
        <button onClick={onToggle} className="btn-primary w-full h-12"><Play className="h-4 w-4 fill-current" /> Iniciar treino</button>
      </div>
    )
  }

  return (
    <div className={cn('app-card overflow-hidden', !aberto && 'lift')}>
      <button onClick={onToggle} aria-expanded={aberto} className="w-full text-left p-4 flex items-center gap-4 min-h-[80px]">
        <span className={cn('h-12 w-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0',
          aberto && destaque ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
          {feitoHoje ? <Check className="h-6 w-6 text-dieta" strokeWidth={2} /> : letra}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xl tracking-[-0.01em] text-foreground truncate">{treino.titulo}</span>
          <span className="block text-xs font-medium text-muted-foreground">{feitoHoje ? 'Feito hoje · ' : ''}{meta}</span>
        </span>
        {aberto
          ? <ChevronDown className="h-5 w-5 text-muted-foreground rotate-180" strokeWidth={1.75} />
          : <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />}
      </button>

      {aberto && (
        <div className="border-t border-border p-3 space-y-3">
          {treino.descricao && <p className="text-muted-foreground px-1">{treino.descricao}</p>}
          <div className="flex items-center gap-3 px-1">
            <p className="flex-1 text-sm text-muted-foreground">Toque no bloco que vai fazer para ver os exercícios.</p>
            <button onClick={() => descanso.abrir(treino.titulo)}
              className="press flex-shrink-0 h-11 px-4 rounded-full border border-border flex items-center gap-2 text-sm font-medium text-foreground hover:bg-muted">
              <Timer className="h-4 w-4" strokeWidth={1.75} /> Descanso
            </button>
          </div>
          <BlocosTreino exercicios={ex} treinoId={treino.id} userId={userId} />
        </div>
      )}
    </div>
  )
}

/**
 * Treino em blocos: Bloco 1 (Mobilidade), Bloco 2 (Ativação, se tiver), Bloco 3 (Treino).
 * Só um bloco aberto por vez; toque no bloco para ver os exercícios dele.
 */
function BlocosTreino({ exercicios, treinoId, userId }: { exercicios: any[]; treinoId: string; userId: string }) {
  const blocos = agruparBlocos(exercicios)
  const [aberto, setAberto] = useState<string | null>(blocos[0]?.id ?? null)
  // Marcações de mobilidade/ativação de hoje, salvas em treino_checks (chave: secao|nome)
  const [feitos, setFeitos] = useState<Set<string>>(new Set())
  const [erroCheck, setErroCheck] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const chave = chaveCheck

  useEffect(() => {
    let vivo = true
    createClient().from('treino_checks').select('secao, exercicio_nome')
      .eq('user_id', userId).eq('treino_id', treinoId).eq('data', dateKey())
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) { console.error('treino_checks:', error.message); return }
        setFeitos(new Set((data ?? []).map(c => `${c.secao}|${c.exercicio_nome}`)))
      })
    return () => { vivo = false }
  }, [userId, treinoId])

  async function alternarFeito(ex: any) {
    const k = chave(ex)
    const marcar = !feitos.has(k)
    const aplicar = (on: boolean) => setFeitos(prev => {
      const n = new Set(prev)
      if (on) n.add(k); else n.delete(k)
      return n
    })
    aplicar(marcar) // otimista: o aluno não espera a rede
    setErroCheck(null)
    const supabase = createClient()
    // treino_checks.secao guarda o id do bloco
    const linha = { user_id: userId, treino_id: treinoId, secao: infoBloco(ex).id, exercicio_nome: ex.nome, data: dateKey() }
    const { error } = marcar
      ? await supabase.from('treino_checks').upsert(linha, { onConflict: 'treino_id,secao,exercicio_nome,data', ignoreDuplicates: true })
      : await supabase.from('treino_checks').delete()
          .eq('treino_id', treinoId).eq('secao', linha.secao).eq('exercicio_nome', ex.nome).eq('data', linha.data)
    if (error) {
      aplicar(!marcar)
      setErroCheck(error.message.includes('treino_checks')
        ? 'Falta atualizar o banco (migrations 005 e 006).'
        : 'Não foi possível salvar. Confira a conexão e tente de novo.')
    }
  }

  function abrir(id: string | null) {
    setAberto(id)
    if (id) requestAnimationFrame(() => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="space-y-2">
      {blocos.map((b, bi) => {
        const estaAberto = aberto === b.id
        const preparo = b.tipo === 'preparo'
        const qtdFeitos = preparo ? b.itens.filter(({ item }) => feitos.has(chave(item))).length : 0
        const completo = preparo && qtdFeitos === b.itens.length
        const proximo = blocos[bi + 1]
        return (
          <div key={b.id} ref={el => { refs.current[b.id] = el }}
            className={cn('rounded-2xl border overflow-hidden scroll-mt-4 transition-colors',
              estaAberto ? 'border-primary' : 'border-border')}>
            <button type="button" onClick={() => abrir(estaAberto ? null : b.id)} aria-expanded={estaAberto}
              className="w-full flex items-center gap-3 p-4 min-h-[64px] text-left hover:bg-muted/40 transition-colors">
              <span aria-label={`Bloco ${bi + 1}`}
                className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors tabular-nums',
                  completo ? 'bg-dieta text-white' : estaAberto ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                {completo
                  ? <Check className="h-5 w-5" strokeWidth={2.25} />
                  : <span className="leading-none whitespace-nowrap">
                      <span className="text-[11px] font-medium opacity-60 align-top">#</span>
                      <span className="text-lg font-semibold tracking-[-0.02em]">{numeroBloco(bi).slice(1)}</span>
                    </span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-medium text-muted-foreground">{preparo ? 'Marcar feito' : 'Registrar carga'}</span>
                <span className="block text-lg leading-tight tracking-[-0.01em] text-foreground truncate">{b.titulo}</span>
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {preparo ? `${qtdFeitos}/${b.itens.length}` : `${b.itens.length} exercício${b.itens.length !== 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform duration-150 flex-shrink-0', estaAberto && 'rotate-180')} strokeWidth={1.75} />
            </button>

            {estaAberto && (
              <div className="border-t border-border p-3 space-y-2">
                {!preparo
                  ? <p className="text-sm text-muted-foreground px-1">Toque em cada exercício para registrar a carga.</p>
                  : <p className="text-sm text-muted-foreground px-1">Toque no exercício quando terminar.</p>}
                {preparo && erroCheck && <p role="alert" className="form-error px-1">{erroCheck}</p>}
                {b.itens.map(({ item, index }, pos) => preparo
                  ? <ExercicioPreparo key={index} exercicio={item} numero={pos + 1} feito={feitos.has(chave(item))} onToggle={() => alternarFeito(item)} />
                  : <ProgressaoExercicio key={index} exercicio={item} treinoId={treinoId} userId={userId} index={pos} />
                )}
                {proximo && (
                  <button type="button" onClick={() => abrir(proximo.id)}
                    className={cn('w-full h-12 mt-1', completo ? 'btn-primary' : 'btn-secondary')}>
                    Próximo: <span className="tabular-nums">{numeroBloco(bi + 1)}</span> {proximo.titulo} <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Exercício de bloco "só marcar feito": sem registro de carga, toque para marcar. */
function ExercicioPreparo({ exercicio, numero, feito, onToggle }: { exercicio: any; numero: number; feito: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={feito}
      className="w-full border border-border rounded-xl p-4 flex items-center gap-3 text-left min-h-[56px] hover:bg-muted/40 transition-colors">
      <span className={cn('h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium transition-colors',
        feito ? 'bg-dieta text-white' : 'bg-muted text-foreground')}>
        {feito ? <Check className="h-4 w-4" strokeWidth={2.25} /> : numero}
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn('block text-sm font-medium text-foreground', feito && 'line-through opacity-60')}>{exercicio.nome}</span>
        <span className="block text-xs text-muted-foreground">
          {exercicio.series} × {exercicio.reps}{exercicio.observacoes ? ` · ${exercicio.observacoes}` : ''}
        </span>
      </span>
    </button>
  )
}
