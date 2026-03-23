'use client'

import { useState, useMemo, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Star, MapPin, Users, X, Loader2, Send, Search,
  Award, BookOpen, Scale,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { peritos } from '@/lib/mocks/peritos'
import {
  rankPeritosPorDemanda,
  rankPeritos,
  getCategoriaLabel,
  getCategoriaColor,
  type MatchResult,
} from '@/lib/utils/matching'
import { enviarProposta } from '@/lib/actions/propostas'
import { formatCurrency } from '@/lib/utils'

// ─── Options ──────────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  '', 'Avaliação de Imóvel', 'Engenharia Civil', 'Perícia Trabalhista',
  'Perícia Contábil', 'Avaliação de Empresa', 'Perícia Médica', 'Ambiental',
]

const UFS = ['', 'RJ', 'SP', 'MG', 'ES', 'PR', 'SC', 'RS', 'BA', 'GO', 'DF']

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400">{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = getCategoriaColor(score)
  const label = getCategoriaLabel(score)
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${color}`}>
        {score}% match
      </span>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

function PeritosContent() {
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') ?? ''
  const uf = searchParams.get('uf') ?? ''
  const cidade = searchParams.get('cidade') ?? ''
  const tribunal = searchParams.get('tribunal') ?? ''
  const demandaId = searchParams.get('demandaId') ?? ''
  const demandaTitulo = searchParams.get('demandaTitulo') ?? ''

  const [tipoFilter, setTipoFilter] = useState(tipo)
  const [ufFilter, setUfFilter] = useState(uf)
  const [modal, setModal] = useState<{ peritoId: string; peritoNome: string } | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviado, setEnviado] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const isMatchMode = !!(tipo && uf)

  // Ranked list
  const ranked = useMemo((): (MatchResult | ReturnType<typeof rankPeritos>[0])[] => {
    const t = tipoFilter || tipo
    const u = ufFilter || uf

    if (isMatchMode || (t && u)) {
      return rankPeritosPorDemanda(peritos, {
        tipo: t,
        uf: u,
        cidade: cidade || undefined,
        tribunal: tribunal || undefined,
      })
    }
    // Sem match mode: filtrar disponíveis, sem score significativo
    return peritos
      .filter((p) => p.disponivel)
      .map((p) => ({ ...p, score: 0, categoria: 'baixa' as const }))
  }, [tipoFilter, ufFilter, tipo, uf, cidade, tribunal, isMatchMode])

  const filtered = useMemo(() => {
    return ranked.filter((p) => {
      const matchTipo = !tipoFilter || p.especialidades.some(
        (e) => e === tipoFilter || e.toLowerCase().includes(tipoFilter.toLowerCase())
      )
      const matchUf = !ufFilter || p.regioes.includes(ufFilter)
      return matchTipo && matchUf
    })
  }, [ranked, tipoFilter, ufFilter])

  function handleEnviarProposta(peritoId: string, peritoNome: string) {
    setModal({ peritoId, peritoNome })
    setMensagem('')
  }

  function handleConfirmarEnvio() {
    if (!modal) return
    startTransition(async () => {
      await enviarProposta({
        demandaId: demandaId || 'avulso',
        demandaTitulo: demandaTitulo || 'Convite direto',
        peritoId: modal.peritoId,
        peritoNome: modal.peritoNome,
        mensagem: mensagem || undefined,
      })
      setEnviado((prev) => new Set([...prev, modal.peritoId]))
      setModal(null)
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buscar Peritos"
        description={
          isMatchMode
            ? `Peritos compatíveis com "${tipo}" em ${cidade || uf}`
            : 'Encontre o perito ideal para sua demanda'
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-zinc-300 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
        >
          <option value="">Todas especialidades</option>
          {ESPECIALIDADES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={ufFilter}
          onChange={(e) => setUfFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-zinc-300 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
        >
          <option value="">Todos os estados</option>
          {UFS.filter(Boolean).map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {(tipoFilter || ufFilter) && (
          <button
            onClick={() => { setTipoFilter(''); setUfFilter('') }}
            className="flex items-center gap-1 h-9 px-3 rounded-lg border border-border text-xs text-zinc-400 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
        {isMatchMode && (
          <span className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs font-medium text-brand-400">
            <Award className="h-3.5 w-3.5" />
            Ordenado por compatibilidade
          </span>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum perito encontrado"
          description="Tente outros filtros ou especialidade."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const matchResult = p as MatchResult
            const showScore = isMatchMode && matchResult.score > 0

            return (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* Header: avatar + nome + score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-foreground text-sm font-bold">
                      {p.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{p.nome}</p>
                      <Stars rating={p.rating} />
                    </div>
                  </div>
                  {showScore && <ScoreBadge score={matchResult.score} />}
                </div>

                {/* Formação */}
                <p className="text-[11px] text-zinc-500 leading-snug line-clamp-1">
                  {p.formacao}
                </p>

                {/* Especialidades */}
                <div className="flex flex-wrap gap-1">
                  {p.especialidades.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400"
                    >
                      {e}
                    </span>
                  ))}
                </div>

                {/* Bio */}
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.bio}</p>

                {/* Tribunais */}
                {p.tribunais.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <Scale className="h-3 w-3 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {p.tribunais.map((t) => (
                        <span key={t} className="inline-flex items-center rounded-md bg-zinc-900/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="space-y-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.regioes.join(', ')} · {p.cidades.slice(0, 2).join(', ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.pericias_concluidas} perícias concluídas
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className="text-xs text-zinc-400">
                    A partir de <strong className="text-foreground">{formatCurrency(p.valor_referencia)}</strong>
                  </span>
                  {enviado.has(p.id) ? (
                    <BadgeStatus status="enviada" />
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1 bg-brand-500 hover:bg-lime-600 text-foreground font-semibold"
                      onClick={() => handleEnviarProposta(p.id, p.nome)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar proposta
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="w-full max-w-md rounded-xl bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Enviar Proposta</h2>
                <p className="text-xs text-zinc-400 mt-0.5">{modal.peritoNome}</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="ml-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-900/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {demandaTitulo && (
                <div className="rounded-lg bg-brand-500/10 border border-lime-100 p-3">
                  <p className="text-xs text-brand-400 font-medium">Demanda vinculada</p>
                  <p className="text-xs text-brand-500 mt-0.5">{demandaTitulo}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Mensagem <span className="text-zinc-500 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  placeholder="Descreva o trabalho e condições..."
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal(null)} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1 bg-brand-500 hover:bg-lime-600 text-foreground font-semibold"
                onClick={handleConfirmarEnvio}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isPending ? 'Enviando...' : 'Enviar Proposta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PeritosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-sm">Carregando...</div>}>
      <PeritosContent />
    </Suspense>
  )
}
