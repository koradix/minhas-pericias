import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, CheckCircle2, Clock, ChevronRight,
  FileSearch, AlignLeft, Layers, Cpu, Stethoscope, Hammer,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { IntakeAIActions } from '@/components/processos/intake-ai-actions'
import { DadosExtraidosBlock, getEmphasis } from '@/components/processos/dados-extraidos-block'
import { ResumoBlock } from '@/components/processos/resumo-block'
import type { ExtractProcessDataOutput, GenerateProcessSummaryOutput } from '@/lib/ai/types'
import type { ResumoData } from '@/lib/actions/processos-intake'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Processo' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  upload_feito:    { label: 'Upload feito',    variant: 'secondary' },
  extraindo:       { label: 'Extraindo...',    variant: 'warning'   },
  extracao_pronta: { label: 'Dados extraídos', variant: 'info'      },
  resumindo:       { label: 'Resumindo...',    variant: 'warning'   },
  resumo_pronto:   { label: 'Resumo pronto',   variant: 'info'      },
  card_criado:     { label: 'Card criado',     variant: 'success'   },
}

const emphasisMeta = {
  engineering: { label: 'Ênfase: campo e endereço', icon: Hammer      },
  medicine:    { label: 'Ênfase: partes e contexto', icon: Stethoscope },
  default:     { label: null, icon: null },
} as const

export default async function ProcessoIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [row, perfil] = await Promise.all([
    prisma.processoIntake.findUnique({
      where: { id },
      select: {
        id: true, peritoId: true, nomeArquivo: true, tamanhoBytes: true,
        mimeType: true, status: true, dadosExtraidos: true,
        resumo: true, periciaId: true, criadoEm: true,
      },
    }).catch(() => null),
    prisma.peritoPerfil.findUnique({
      where: { userId: session.user.id },
      select: { areaPrincipal: true },
    }).catch(() => null),
  ])

  if (!row || row.peritoId !== session.user.id) notFound()

  // Fetch linked perícia if card was already created
  const periciaRow = row.periciaId
    ? await prisma.pericia.findUnique({
        where: { id: row.periciaId },
        select: { id: true, numero: true, assunto: true, tipo: true, vara: true, status: true, prazo: true, processo: true },
      }).catch(() => null)
    : null

  const intake   = { ...row, criadoEm: toISO(row.criadoEm) }
  const st       = statusMap[intake.status] ?? { label: intake.status, variant: 'secondary' as const }
  const dados    = intake.dadosExtraidos
    ? (JSON.parse(intake.dadosExtraidos) as ExtractProcessDataOutput)
    : null

  // resumo is stored as structured JSON; fall back gracefully for older flat-text rows
  const resumoParsed: ResumoData | null = (() => {
    if (!intake.resumo) return null
    try {
      const parsed = JSON.parse(intake.resumo) as GenerateProcessSummaryOutput
      // Validate expected shape
      if (typeof parsed.resumoCurto === 'string') return parsed as ResumoData
    } catch { /* flat-text legacy row — ignore */ }
    return null
  })()

  const emphasis  = getEmphasis(perfil?.areaPrincipal)
  const emphMeta  = emphasisMeta[emphasis]
  const isPdf     = intake.mimeType?.includes('pdf') || intake.nomeArquivo.endsWith('.pdf')
  const hasData   = dados !== null
  const hasResumo = resumoParsed !== null
  const hasCard   = Boolean(intake.periciaId)
  const stepsDone = [hasData, hasResumo, hasCard].filter(Boolean).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/processos"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Processos
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
          <FileText className={isPdf ? 'h-5 w-5 text-rose-400' : 'h-5 w-5 text-slate-400'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={st.variant}>{st.label}</Badge>
            {intake.periciaId && (
              <Link href={`/pericias/${intake.periciaId}`}>
                <Badge variant="success" className="cursor-pointer hover:opacity-80">
                  Ver perícia →
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 truncate">{intake.nomeArquivo}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatBytes(intake.tamanhoBytes)} · enviado em{' '}
            {new Date(intake.criadoEm).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < stepsDone ? 'bg-lime-500' : 'bg-slate-300'
              }`}
            />
          ))}
          <span className="ml-0.5 tabular-nums">{stepsDone}/3</span>
        </div>
      </div>

      {/* ── Bloco 1: Documento enviado ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <FileSearch className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Documento enviado</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            {
              label: 'Nome do arquivo',
              value: intake.nomeArquivo,
            },
            {
              label: 'Tamanho',
              value: formatBytes(intake.tamanhoBytes),
            },
            {
              label: 'Tipo',
              value: intake.mimeType?.includes('pdf')
                ? 'PDF'
                : intake.mimeType?.includes('word') || intake.nomeArquivo.endsWith('.docx')
                  ? 'DOCX'
                  : intake.mimeType ?? '—',
            },
            {
              label: 'Enviado em',
              value: new Date(intake.criadoEm).toLocaleDateString('pt-BR'),
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                {label}
              </p>
              <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bloco 2: Dados extraídos ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap gap-y-1">
            <Layers className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Dados extraídos</h2>
            {hasData && emphMeta.label && emphMeta.icon && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                <emphMeta.icon className="h-2.5 w-2.5" />
                {emphMeta.label}
              </span>
            )}
          </div>
          {hasData && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
        </div>

        <div className="px-5 py-4">
          {hasData && dados ? (
            <DadosExtraidosBlock dados={dados} emphasis={emphasis} />
          ) : (
            <div className="flex items-center gap-3 py-4 text-slate-400">
              <Cpu className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Dados serão exibidos aqui após executar{' '}
                <strong className="text-slate-600">Extrair dados</strong> abaixo.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bloco 3: Resumo do processo ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <AlignLeft className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Resumo do processo</h2>
          </div>
          {hasResumo && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
        <div className="px-5 py-5">
          {hasResumo && resumoParsed ? (
            <ResumoBlock intakeId={intake.id} resumo={resumoParsed} />
          ) : (
            <div className="flex items-center gap-3 py-4 text-slate-400">
              <Cpu className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Resumo gerado por IA aparecerá aqui após executar{' '}
                <strong className="text-slate-600">Gerar resumo</strong> abaixo.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bloco 4: Card da perícia ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Card da perícia</h2>
          </div>
          {hasCard && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
        <div className="px-5 py-4">
          {hasCard && periciaRow ? (
            <div className="space-y-4">
              {/* Perícia preview card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3 border-b border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-emerald-900 truncate">{periciaRow.assunto}</p>
                    <p className="text-xs text-emerald-600 font-mono mt-0.5">{periciaRow.numero}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 border border-emerald-200">
                    {periciaRow.tipo}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 py-3">
                  {periciaRow.processo && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-0.5">Processo</p>
                      <p className="text-xs font-mono text-emerald-800">{periciaRow.processo}</p>
                    </div>
                  )}
                  {periciaRow.vara && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-0.5">Vara</p>
                      <p className="text-xs text-emerald-800 truncate">{periciaRow.vara}</p>
                    </div>
                  )}
                  {periciaRow.prazo && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-0.5">Prazo</p>
                      <p className="text-xs text-emerald-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{periciaRow.prazo}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-0.5">Status</p>
                    <p className="text-xs text-emerald-800">Processo importado</p>
                  </div>
                </div>
              </div>

              {/* Next step guidance */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
                  <ChevronRight className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Próximo passo: agendar vistoria</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    A perícia foi registrada. Acesse o card para adicionar à rota, registrar prazo e iniciar o trabalho de campo.
                  </p>
                </div>
                <Link
                  href={`/pericias/${periciaRow.id}`}
                  className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
                >
                  Abrir <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : hasCard ? (
            /* Card created but pericia row not found (edge case) */
            <Link
              href={`/pericias/${intake.periciaId}`}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Perícia criada</p>
                <p className="text-xs text-emerald-600">Clique para abrir →</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 py-4 text-slate-400">
              <Cpu className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                O card da perícia será criado aqui após executar{' '}
                <strong className="text-slate-600">Criar card</strong> abaixo.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bloco 5: Ações IA ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Ações IA</h2>
          {stepsDone === 0 && (
            <span className="inline-flex items-center rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-lime-700">
              Comece aqui
            </span>
          )}
        </div>

        <IntakeAIActions
          intakeId={intake.id}
          status={intake.status}
          hasData={hasData}
          hasResumo={hasResumo}
        />
      </section>
    </div>
  )
}
