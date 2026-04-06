'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  FileText,
  Scale,
  BookOpen,
} from 'lucide-react'
import { EnderecoVistoriaEdit } from './endereco-vistoria-edit'
import type { AnaliseProcessoV2 } from '@/lib/ai/prompt-mestre-resumo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (arr: unknown): string[] => (Array.isArray(arr) ? (arr as string[]) : [])

function paragraphs(block: {
  paragrafo_1: string | null
  paragrafo_2: string | null
  paragrafo_3: string | null
  paragrafo_4: string | null
}): string[] {
  return [
    block.paragrafo_1,
    block.paragrafo_2,
    block.paragrafo_3,
    block.paragrafo_4,
  ].filter((p): p is string => !!p)
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionToggle({
  icon,
  label,
  accent,
  children,
  defaultOpen = false,
  badge,
}: {
  icon: React.ReactNode
  label: string
  accent?: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#f8f9ff] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className={accent ?? 'text-[#6b7280]'}>{icon}</span>
          <span className="text-[13px] font-semibold text-[#1f2937] font-manrope">{label}</span>
          {badge}
        </span>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-[#9ca3af] flex-shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af] flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-[#f2f3f9]">
          {children}
        </div>
      )}
    </div>
  )
}

function ParagraphList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-[12px] text-[#9ca3af] italic mt-2">Não identificado no documento.</p>
  return (
    <div className="space-y-2 mt-3">
      {items.map((p, i) => (
        <p key={i} className="text-[13px] text-[#374151] leading-relaxed font-inter">{p}</p>
      ))}
    </div>
  )
}

const COMPLEXIDADE_CLS: Record<string, string> = {
  'baixa': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'média': 'bg-amber-50 text-amber-700 border border-amber-200',
  'alta':  'bg-rose-50 text-rose-700 border border-rose-200',
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AnaliseProcessoV2Block({
  analise,
  nomeacaoId,
}: {
  analise: AnaliseProcessoV2
  nomeacaoId?: string
}) {
  const op  = analise.operacional
  const nd  = op.nomeacaoDespacho
  const ah  = op.aceiteHonorarios
  const pr  = op.prazos
  const lp  = op.localPericia

  const quesitos          = safe(nd.quesitos)
  const proxPassos        = safe(analise.proximos_passos)
  const justificativas    = safe(ah.justificativasAumento)
  const riscosTec         = safe(op.riscos.tecnico)
  const riscosJur         = safe(op.riscos.juridico)
  const infoFaltando      = safe(op.riscos.informacoesFaltando)
  const checklist         = safe(op.checklist)
  const fundamentacao     = Array.isArray(analise.fundamentacao_oficial) ? analise.fundamentacao_oficial : []
  const dadosFaltantes    = safe(analise.qa.dados_faltantes)

  const pIni  = paragraphs(analise.peticao_inicial)
  const cont  = paragraphs(analise.contestacao)
  const repl  = paragraphs(analise.replica)

  const hasReplica = repl.length > 0
  const hasContestacao = cont.length > 0

  const endereco = op.enderecoVistoria ?? lp.enderecoCompleto ?? null

  return (
    <div className="space-y-2.5">

      {/* ── HERO: Objeto do processo ─────────────────────────────────────────── */}
      {analise.objeto_processo.resumo_curto && (
        <div className="rounded-xl border-l-[3px] border-l-[#416900] border border-[#d8f5a2] bg-[#f4fce3] px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#416900]/70 mb-1">
            Objeto do processo
          </p>
          <p className="text-[14px] font-semibold text-[#102000] leading-snug font-manrope">
            {analise.objeto_processo.resumo_curto}
          </p>
        </div>
      )}

      {/* ── HERO: Ponto controvertido ─────────────────────────────────────────── */}
      {analise.ponto_controvertido.resumo && (
        <div className="rounded-xl border-l-[3px] border-l-amber-500 border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 mb-1">
            Ponto controvertido
          </p>
          <p className="text-[13px] text-amber-900 leading-relaxed font-inter">
            {analise.ponto_controvertido.resumo}
          </p>
        </div>
      )}

      {/* ── Próximos passos — always visible ──────────────────────────────────── */}
      {proxPassos.length > 0 && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#416900] mb-2.5">
            <ListChecks className="h-3.5 w-3.5" /> Próximos passos
          </p>
          <ol className="space-y-1.5">
            {proxPassos.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#374151] font-inter">
                <span className="flex-shrink-0 mt-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-[#416900]/10 text-[10px] font-bold text-[#416900]">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── 1. Entendimento geral ──────────────────────────────────────────────── */}
      <SectionToggle
        icon={<Users className="h-3.5 w-3.5" />}
        label="Entendimento geral"
        accent="text-[#6366f1]"
        defaultOpen={true}
      >
        <div className="mt-3 space-y-3">
          {/* Partes */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#f8f9ff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-0.5">Autor</p>
              <p className="text-[13px] font-semibold text-[#1f2937]">{analise.partes.autor ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-[#f8f9ff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-0.5">Réu</p>
              <p className="text-[13px] font-semibold text-[#1f2937]">{analise.partes.reu ?? '—'}</p>
            </div>
          </div>
          {safe(analise.partes.terceiros_relevantes).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1">Terceiros relevantes</p>
              {safe(analise.partes.terceiros_relevantes).map((t, i) => (
                <p key={i} className="text-[12px] text-[#6b7280]">· {t}</p>
              ))}
            </div>
          )}

          {/* Tipo */}
          <div className="flex flex-wrap gap-2">
            {analise.tipo_processo.classe && (
              <span className="inline-flex items-center rounded-md bg-[#f2f3f9] border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#374151]">
                {analise.tipo_processo.classe}
              </span>
            )}
            {analise.tipo_processo.natureza && (
              <span className="inline-flex items-center rounded-md bg-[#f2f3f9] border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#374151]">
                {analise.tipo_processo.natureza}
              </span>
            )}
          </div>

          {/* Prazos + Endereço */}
          <div className="grid sm:grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-[#f8f9ff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-500 mb-1.5">Prazos</p>
              <div className="space-y-0.5 text-[12px] text-[#6b7280]">
                {pr.prazoAceite && <p><span className="text-[#9ca3af]">Aceite:</span> <span className="font-semibold text-[#374151]">{pr.prazoAceite}</span></p>}
                {pr.prazoLaudo  && <p><span className="text-[#9ca3af]">Laudo:</span>  <span className="font-semibold text-[#374151]">{pr.prazoLaudo}</span></p>}
                {safe(pr.outrosPrazos).map((p, i) => <p key={i}>· {p}</p>)}
                {!pr.prazoAceite && !pr.prazoLaudo && safe(pr.outrosPrazos).length === 0 && (
                  <p className="italic text-[#d1d5db]">Não identificados</p>
                )}
              </div>
            </div>
            {nomeacaoId ? (
              <EnderecoVistoriaEdit nomeacaoId={nomeacaoId} endereco={endereco} />
            ) : endereco ? (
              <div className="rounded-lg bg-[#f8f9ff] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1">Local</p>
                <p className="text-[12px] text-[#374151]">{endereco}</p>
              </div>
            ) : null}
          </div>
        </div>
      </SectionToggle>

      {/* ── 2. Petição inicial ────────────────────────────────────────────────── */}
      <SectionToggle
        icon={<FileText className="h-3.5 w-3.5" />}
        label="Petição inicial"
        accent="text-[#6b7280]"
      >
        <ParagraphList items={pIni} />
      </SectionToggle>

      {/* ── 3. Contestação ────────────────────────────────────────────────────── */}
      <SectionToggle
        icon={<Scale className="h-3.5 w-3.5" />}
        label="Contestação"
        accent="text-[#6b7280]"
        badge={!hasContestacao ? (
          <span className="ml-1.5 text-[10px] text-[#9ca3af] italic font-normal">não localizada</span>
        ) : undefined}
      >
        {hasContestacao
          ? <ParagraphList items={cont} />
          : <p className="text-[12px] text-[#9ca3af] italic mt-3">Contestação não identificada no documento.</p>
        }
      </SectionToggle>

      {/* ── 4. Réplica — destaque especial ───────────────────────────────────── */}
      <SectionToggle
        icon={<BookOpen className="h-3.5 w-3.5" />}
        label="Réplica"
        accent="text-violet-600"
        badge={
          hasReplica ? (
            <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
          ) : (
            <span className="ml-1.5 text-[10px] text-[#9ca3af] italic font-normal">não localizada</span>
          )
        }
      >
        {hasReplica
          ? <ParagraphList items={repl} />
          : <p className="text-[12px] text-[#9ca3af] italic mt-3">Réplica não identificada no documento.</p>
        }
      </SectionToggle>

      {/* ── 5. Análise resumida ────────────────────────────────────────────────── */}
      {analise.opiniao_tecnica_breve.resumo && (
        <SectionToggle
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          label="Análise resumida"
          accent="text-[#416900]"
        >
          <div className="mt-3 space-y-3">
            <p className="text-[13px] text-[#374151] leading-relaxed font-inter">
              {analise.opiniao_tecnica_breve.resumo}
            </p>

            {/* Complexidade + estratégia honorários */}
            {(ah.complexidade || ah.estrategiaHonorarios) && (
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-500">Honorários</p>
                  {ah.complexidade && (
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${COMPLEXIDADE_CLS[ah.complexidade] ?? COMPLEXIDADE_CLS['baixa']}`}>
                      {ah.complexidade}
                    </span>
                  )}
                </div>
                {ah.estrategiaHonorarios && (
                  <p className="text-[12px] text-[#6b7280] leading-relaxed">{ah.estrategiaHonorarios}</p>
                )}
                {justificativas.length > 0 && (
                  <div className="pt-1 space-y-0.5">
                    {justificativas.map((j, i) => (
                      <p key={i} className="text-[11px] text-[#6b7280]">· {j}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quesitos */}
            {quesitos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-500 mb-2">
                  Quesitos ({quesitos.length})
                </p>
                <ol className="space-y-1.5">
                  {quesitos.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-[#6b7280]">
                      <span className="text-violet-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Riscos */}
            {(riscosTec.length > 0 || riscosJur.length > 0 || infoFaltando.length > 0) && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-500">Atenção</p>
                {riscosTec.map((r, i) => <p key={i} className="text-[11px] text-rose-700">· {r}</p>)}
                {riscosJur.map((r, i) => <p key={`j${i}`} className="text-[11px] text-rose-700">· {r}</p>)}
                {infoFaltando.map((r, i) => <p key={`f${i}`} className="text-[11px] text-rose-700 font-medium">⚠ {r}</p>)}
              </div>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-600 mb-2">Checklist</p>
                <ul className="space-y-1">
                  {checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-emerald-800">
                      <span className="text-emerald-400 flex-shrink-0">☐</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionToggle>
      )}

      {/* ── Fundamentação legal (se houver) ──────────────────────────────────── */}
      {fundamentacao.length > 0 && (
        <SectionToggle
          icon={<Scale className="h-3.5 w-3.5" />}
          label="Fundamentação legal"
          accent="text-[#9ca3af]"
        >
          <div className="mt-3 space-y-2.5">
            {fundamentacao.map((f, i) => (
              <div key={i} className="rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-3 py-2.5">
                <p className="text-[12px] text-[#374151] leading-snug mb-1">{f.afirmacao}</p>
                <p className="text-[11px] font-semibold text-[#6b7280]">{f.referencia}</p>
                {f.url_oficial && (
                  <a
                    href={f.url_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#416900] hover:underline"
                  >
                    {f.url_oficial}
                  </a>
                )}
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* ── QA: dados faltantes ───────────────────────────────────────────────── */}
      {dadosFaltantes.length > 0 && (
        <div className="rounded-xl border border-[#fde68a] bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 mb-2">
            <AlertTriangle className="h-3 w-3" /> Dados ausentes no documento
          </p>
          {dadosFaltantes.map((d, i) => (
            <p key={i} className="text-[11px] text-amber-800">· {d}</p>
          ))}
        </div>
      )}
    </div>
  )
}
