'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AnaliseProcessoV2 } from '@/lib/ai/prompt-mestre-resumo'

const safe = (arr: unknown): string[] => (Array.isArray(arr) ? (arr as string[]) : [])

function paragraphs(block: {
  paragrafo_1: string | null
  paragrafo_2: string | null
  paragrafo_3: string | null
  paragrafo_4: string | null
} | null | undefined): string[] {
  if (!block) return []
  return [block.paragrafo_1, block.paragrafo_2, block.paragrafo_3, block.paragrafo_4]
    .filter((p): p is string => !!p)
}

// ─── Collapsible section ────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = false,
  empty,
}: {
  title: string
  children?: React.ReactNode
  defaultOpen?: boolean
  empty?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500 flex-shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="pb-6">
          {empty
            ? <p className="text-[15px] text-slate-400 italic">{empty}</p>
            : children
          }
        </div>
      )}
    </div>
  )
}

function Prose({ text }: { text: string }) {
  return <p className="text-[15px] leading-[1.75] text-slate-600">{text}</p>
}

function ParagraphStack({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-[15px] text-slate-400 italic">{empty}</p>
  return (
    <div className="space-y-4">
      {items.map((p, i) => <Prose key={i} text={p} />)}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function AnaliseProcessoV2Block({ analise }: { analise: AnaliseProcessoV2; nomeacaoId?: string }) {
  const op   = analise.operacional ?? {} as NonNullable<typeof analise.operacional>
  const nd   = op?.nomeacaoDespacho ?? {} as NonNullable<(typeof analise.operacional)['nomeacaoDespacho']>
  const ah   = op?.aceiteHonorarios ?? {} as NonNullable<(typeof analise.operacional)['aceiteHonorarios']>
  const pr   = op?.prazos ?? {} as NonNullable<(typeof analise.operacional)['prazos']>

  const autor      = analise.partes?.autor ?? null
  const reu        = analise.partes?.reu ?? null
  const terceiros  = safe(analise.partes?.terceiros_relevantes)
  const tipo       = analise.tipo_processo?.natureza ?? analise.tipo_processo?.classe ?? null
  const objeto     = analise.objeto_processo?.resumo_curto ?? null

  const pIni = paragraphs(analise.peticao_inicial)
  const cont = paragraphs(analise.contestacao)
  const repl = paragraphs(analise.replica)

  const pontoCont      = analise.ponto_controvertido?.resumo ?? null
  const opiniao        = analise.opiniao_tecnica_breve?.resumo ?? null
  const quesitos       = safe(nd.quesitos)
  const proxPassos     = safe(analise.proximos_passos)
  const outrosPrazos   = safe(pr.outrosPrazos)
  const justificativas = safe(ah.justificativasAumento)

  return (
    <div>

      {/* ── Resumo inicial — sempre visível, sem toggle ──────────────────── */}
      <div className="pb-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-5">Resumo inicial</h2>

        {objeto && (
          <p className="text-base font-semibold text-slate-800 leading-snug mb-6">{objeto}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 text-[15px]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Autor</p>
            <p className="font-medium text-slate-700">{autor ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Réu</p>
            <p className="font-medium text-slate-700">{reu ?? '—'}</p>
          </div>
          {tipo && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Tipo</p>
              <p className="text-slate-600">{tipo}</p>
            </div>
          )}
          {(pr.prazoAceite || pr.prazoLaudo || outrosPrazos.length > 0) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Prazos</p>
              <div className="text-slate-600 space-y-0.5">
                {pr.prazoAceite && <p>Aceite: <span className="font-medium text-slate-700">{pr.prazoAceite}</span></p>}
                {pr.prazoLaudo  && <p>Laudo: <span className="font-medium text-slate-700">{pr.prazoLaudo}</span></p>}
                {outrosPrazos.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          )}
        </div>

        {terceiros.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Terceiros</p>
            <p className="text-[15px] text-slate-600">{terceiros.join(' · ')}</p>
          </div>
        )}
      </div>

      {/* ── Petição inicial ─────────────────────────────────────────────── */}
      <Section title="Petição inicial">
        <ParagraphStack items={pIni} empty="Não identificada no documento." />
      </Section>

      {/* ── Contestação ──────────────────────────────────────────────────── */}
      <Section title="Contestação">
        <ParagraphStack items={cont} empty="Não localizada no documento." />
      </Section>

      {/* ── Réplica ──────────────────────────────────────────────────────── */}
      <Section title="Réplica">
        <ParagraphStack items={repl} empty="Não localizada no documento." />
      </Section>

      {/* ── Ponto controvertido — destaque com borda lime ────────────────── */}
      <Section title="Ponto controvertido" defaultOpen>
        {pontoCont
          ? (
            <div className="bg-lime-50 border-l-4 border-lime-500 rounded-r-xl px-6 py-5">
              <p className="text-[15px] font-semibold text-slate-800 leading-snug">{pontoCont}</p>
            </div>
          )
          : <p className="text-[15px] text-slate-400 italic">Não identificado.</p>
        }
      </Section>

      {/* ── Breve opinião técnica ─────────────────────────────────────────── */}
      {(opiniao || ah.complexidade || ah.estrategiaHonorarios) && (
        <Section title="Breve opinião técnica" defaultOpen>
          <div className="space-y-4">
            {opiniao && <Prose text={opiniao} />}
            {(ah.complexidade || ah.estrategiaHonorarios) && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Honorários — complexidade {ah.complexidade ?? '—'}
                </p>
                {ah.estrategiaHonorarios && <Prose text={ah.estrategiaHonorarios} />}
                {justificativas.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {justificativas.map((j, i) => (
                      <li key={i} className="text-[15px] text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">{j}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Próximos passos ───────────────────────────────────────────────── */}
      {proxPassos.length > 0 && (
        <Section title="Próximos passos" defaultOpen>
          <ol className="space-y-3">
            {proxPassos.map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-[15px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-300 flex-shrink-0 w-5 text-right mt-0.5">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── Quesitos ──────────────────────────────────────────────────────── */}
      {quesitos.length > 0 && (
        <Section title={`Quesitos (${quesitos.length})`}>
          <ol className="space-y-3">
            {quesitos.map((q, i) => (
              <li key={i} className="flex items-start gap-4 text-[15px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-300 flex-shrink-0 w-5 text-right mt-0.5">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  )
}
