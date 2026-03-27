import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  Hash,
  Sparkles,
  Users,
} from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { DadosExtraidosBlock } from '@/components/processos/dados-extraidos-block'
import { NomeacaoIntakeActions } from '@/components/nomeacoes/nomeacao-intake-actions'
import { NomeacaoDocumentosSection } from '@/components/nomeacoes/nomeacao-documentos'
import { AnaliseProcessoBlock } from '@/components/nomeacoes/analise-processo-block'
import { scoreBadgeLabel, scoreBadgeClass } from '@/lib/utils/match-nomeacao'
import { cn } from '@/lib/utils'
import type { ExtractProcessDataOutput } from '@/lib/ai/types'
import type { ResumoNomeacao } from '@/lib/actions/nomeacoes-intake'
import { isAnaliseProcesso } from '@/lib/ai/prompt-mestre-resumo'
import type { AnaliseProcesso } from '@/lib/ai/prompt-mestre-resumo'
import type { Metadata } from 'next'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toISO(d: Date | string | null | undefined): string | null {
  if (!d) return null
  return d instanceof Date ? d.toISOString() : new Date(d as string).toISOString()
}

// ─── Status labels ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' }> = {
  novo:         { label: 'Nova',          variant: 'info'      },
  proposta:     { label: 'Proposta',      variant: 'warning'   },
  em_andamento: { label: 'Em andamento',  variant: 'info'      },
  laudo:        { label: 'Laudo',         variant: 'warning'   },
  entregue:     { label: 'Entregue',      variant: 'success'   },
  arquivado:    { label: 'Arquivado',     variant: 'secondary' },
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const n = await prisma.nomeacao.findUnique({ where: { id }, include: { processo: true } })
    if (n) return { title: n.processo.assunto ?? n.processo.numeroProcesso }
  } catch {}
  return { title: 'Nomeação' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NomeacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const nomeacao = await prisma.nomeacao.findUnique({
    where: { id },
    include: { processo: true },
  }).catch(() => null)

  if (!nomeacao || nomeacao.peritoId !== userId) notFound()

  // Fetch linked perícia if exists
  let pericia: { id: string; numero: string } | null = null
  if (nomeacao.periciaId) {
    pericia = await prisma.pericia.findUnique({
      where: { id: nomeacao.periciaId },
      select: { id: true, numero: true },
    }).catch(() => null)
  }

  // Fetch peritoPerfil for emphasis detection
  const peritoPerfil = await prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { areaPrincipal: true },
  }).catch(() => null)

  // Parse extracted data
  let dadosExtraidos: ExtractProcessDataOutput | null = null
  if (nomeacao.extractedData) {
    try { dadosExtraidos = JSON.parse(nomeacao.extractedData) as ExtractProcessDataOutput } catch {}
  }

  // Parse process summary — suporta AnaliseProcesso (novo) e ResumoNomeacao (legado)
  let analise: AnaliseProcesso | null = null
  let resumo: ResumoNomeacao | null = null
  if (nomeacao.processSummary) {
    try {
      const parsed = JSON.parse(nomeacao.processSummary) as Record<string, unknown>
      if (isAnaliseProcesso(parsed)) {
        analise = parsed
      } else {
        resumo = parsed as unknown as ResumoNomeacao
      }
    } catch {}
  }

  const partes: { nome: string; tipo: string }[] = (() => {
    try { return JSON.parse(nomeacao.processo.partes ?? '[]') } catch { return [] }
  })()

  const st = STATUS[nomeacao.status] ?? { label: nomeacao.status, variant: 'secondary' as const }

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/nomeacoes" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Nomeações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium font-mono truncate max-w-xs">
          {nomeacao.processo.numeroProcesso}
        </span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Building2 className="h-2.5 w-2.5" />
                  {nomeacao.processo.tribunal}
                </span>
                <span className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                  scoreBadgeClass(nomeacao.scoreMatch),
                )}>
                  {nomeacao.scoreMatch}% · {scoreBadgeLabel(nomeacao.scoreMatch)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Hash className="h-3 w-3 flex-shrink-0" />
                <span className="font-mono">{nomeacao.processo.numeroProcesso}</span>
              </div>
              {nomeacao.processo.assunto && (
                <h1 className="text-base font-bold text-slate-900 leading-snug">
                  {nomeacao.processo.assunto}
                </h1>
              )}
            </div>
            <Badge variant={st.variant} className="flex-shrink-0 text-sm px-3 py-1">
              {st.label}
            </Badge>
          </div>
        </div>

        {/* Process meta bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-100">
          <div className="px-5 py-3.5 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FileText className="h-3 w-3" /> Classe
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {nomeacao.processo.classe ?? '—'}
            </p>
          </div>
          <div className="px-5 py-3.5 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="h-3 w-3" /> Órgão
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {nomeacao.processo.orgaoJulgador ?? '—'}
            </p>
          </div>
          <div className="px-5 py-3.5 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Calendar className="h-3 w-3" /> Distribuído
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {fmtDate(toISO(nomeacao.processo.dataDistribuicao))}
            </p>
          </div>
        </div>

        {/* Partes */}
        {partes.length > 0 && (
          <div className="px-6 pb-4 pt-3 border-t border-slate-50">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              <Users className="h-3 w-3" /> Partes
            </p>
            <div className="space-y-1">
              {partes.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-[10px] font-semibold text-slate-400 w-14 flex-shrink-0 uppercase">
                    {p.tipo || 'Parte'}
                  </span>
                  <span className="truncate">{p.nome}</span>
                </div>
              ))}
              {partes.length > 4 && (
                <p className="text-[10px] text-slate-400">+{partes.length - 4} partes</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Documents */}
          <NomeacaoDocumentosSection
            nomeacaoId={nomeacao.id}
            nomeArquivo={nomeacao.nomeArquivo ?? null}
            tamanhoBytes={nomeacao.tamanhoBytes ?? null}
          />

          {/* Extracted data */}
          {dadosExtraidos && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Dados extraídos</h2>
              </div>
              <div className="px-5 py-4">
                <DadosExtraidosBlock
                  dados={dadosExtraidos}
                  emphasis={
                    peritoPerfil?.areaPrincipal === 'medicina' || peritoPerfil?.areaPrincipal === 'psicologia'
                      ? 'medicine'
                      : ['engenharia', 'imobiliario', 'meio_ambiente', 'transito'].includes(peritoPerfil?.areaPrincipal ?? '')
                        ? 'engineering'
                        : 'default'
                  }
                />
              </div>
            </section>
          )}

          {/* Process summary — AnaliseProcesso (novo) ou ResumoNomeacao (legado) */}
          {(analise || resumo) && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <FileText className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">
                  {analise ? 'Análise do processo' : 'Resumo do processo'}
                </h2>
              </div>
              <div className="px-5 py-4">
                {analise ? (
                  <AnaliseProcessoBlock analise={analise} />
                ) : resumo ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 leading-relaxed">{resumo.resumoCurto}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Objeto da perícia
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{resumo.objetoDaPericia}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-2">
                          Pontos relevantes
                        </p>
                        <ul className="space-y-1">
                          {(resumo.pontosRelevantes ?? []).map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="text-violet-400 font-bold mt-0.5">·</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-2">
                          Necessidades de campo
                        </p>
                        <ul className="space-y-1">
                          {(resumo.necessidadesDeCampo ?? []).map((n, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="text-amber-400 font-bold mt-0.5">·</span>{n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* Link to perícia if created */}
          {pericia && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Perícia criada</p>
                    <p className="text-xs text-emerald-600">{pericia.numero}</p>
                  </div>
                </div>
                <Link href={`/pericias/${pericia.id}`}>
                  <button className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 transition-colors">
                    Abrir
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </section>
          )}

        </div>

        {/* Right — AI actions panel */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Análise IA</h2>
            </div>
            <div className="px-5 py-4">
              <NomeacaoIntakeActions
                nomeacaoId={nomeacao.id}
                nomeArquivo={nomeacao.nomeArquivo ?? null}
                hasExtracted={!!nomeacao.extractedData}
                hasSummary={!!nomeacao.processSummary}
                periciaId={nomeacao.periciaId ?? null}
                periciaNumero={pericia?.numero ?? null}
              />
            </div>
          </section>

          {/* Timeline */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Encontrada em {fmtDate(toISO(nomeacao.criadoEm))}</span>
            </div>
            {nomeacao.processo.dataUltimaAtu && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Processo atualizado em {fmtDate(toISO(nomeacao.processo.dataUltimaAtu))}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
