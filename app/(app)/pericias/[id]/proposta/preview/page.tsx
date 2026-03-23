import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import { pericias } from '@/lib/mocks/pericias'
import { getPropostaByPericia } from '@/lib/data/propostas-honorarios'
import { PropostaStatusBtn, PROPOSTA_STATUS } from '@/components/pericias/proposta-status-btn'
import { PropostaExportBtn } from '@/components/pericias/proposta-export-btn'
import type { PropostaExportData } from '@/components/pericias/proposta-export-btn'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = pericias.find((x) => x.id === Number(id))
  return { title: p ? `Visualizar Proposta — ${p.numero}` : 'Proposta' }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function DocDivider() {
  return <hr className="border-border" />
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
      {children}
    </section>
  )
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-40 flex-shrink-0 text-xs text-zinc-500">{label}</span>
      <span className="text-sm text-foreground font-medium leading-snug">{value || '—'}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PreviewPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  const p = pericias.find((x) => x.id === Number(id))
  if (!p) notFound()

  const draft = await getPropostaByPericia(String(p.id), userId)
  if (!draft) redirect(`/pericias/${p.id}/proposta`)

  const totalHonorarios =
    (draft.valorHonorarios ?? 0) + (draft.custoDeslocamento ?? 0)

  // Serialize for client component — strip Date fields
  const exportData: PropostaExportData = {
    pericoNumero:       draft.pericoNumero,
    pericoAssunto:      draft.pericoAssunto,
    pericoProcesso:     draft.pericoProcesso,
    pericoVara:         draft.pericoVara,
    pericoPartes:       draft.pericoPartes,
    dataProposta:       draft.dataProposta,
    peritoNome:         draft.peritoNome,
    peritoQualificacao: draft.peritoQualificacao,
    descricaoServicos:  draft.descricaoServicos,
    valorHonorarios:    draft.valorHonorarios,
    custoDeslocamento:  draft.custoDeslocamento,
    horasTecnicas:      draft.horasTecnicas,
    prazoEstimado:      draft.prazoEstimado,
    observacoes:        draft.observacoes,
    complexidadeNota:   draft.complexidadeNota,
  }

  return (
    <div className="space-y-4 pb-10 max-w-3xl mx-auto">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="print:hidden flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/pericias" className="hover:text-zinc-300 transition-colors">Péricias</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/pericias/${p.id}`} className="hover:text-zinc-300 transition-colors">{p.numero}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/pericias/${p.id}/proposta`} className="hover:text-zinc-300 transition-colors">Proposta</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-400 font-medium">Visualizar</span>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="print:hidden flex items-center gap-3">
        <Link
          href={`/pericias/${p.id}/proposta`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-zinc-400 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Visualizar Proposta</h1>
          <p className="text-xs text-zinc-500">
            {draft.status === 'enviada' ? 'Proposta enviada ao juízo' : 'Exportação em PDF disponível em breve'}
          </p>
        </div>
        <PropostaStatusBtn pericoId={String(p.id)} currentStatus={draft.status} />
      </div>

      {/* ══ Document card ═══════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card shadow-saas overflow-hidden">

        {/* ── Document header ────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Proposta de Honorários Periciais
          </p>
          <p className="text-xs text-zinc-500">
            {p.numero} · {formatDate(draft.dataProposta)}
          </p>
        </div>

        {/* ── Document body ──────────────────────────────────────────────── */}
        <div className="px-8 py-7 space-y-6">

          {/* 1. Processo */}
          <DocSection title="I — Identificação do processo">
            <div className="space-y-2">
              <DocRow label="Número do processo"   value={draft.pericoNumero} />
              <DocRow label="Autos"                value={draft.pericoProcesso} />
              <DocRow label="Assunto"              value={draft.pericoAssunto} />
              <DocRow label="Vara / Tribunal"      value={draft.pericoVara} />
              <DocRow label="Parte / Autor"        value={draft.pericoPartes} />
            </div>
          </DocSection>

          <DocDivider />

          {/* 2. Perito */}
          <DocSection title="II — Identificação do perito">
            <div className="space-y-2">
              <DocRow label="Nome"          value={draft.peritoNome} />
              <DocRow label="Qualificação"  value={draft.peritoQualificacao} />
            </div>
          </DocSection>

          <DocDivider />

          {/* 3. Descrição */}
          <DocSection title="III — Descrição dos serviços periciais">
            {draft.descricaoServicos ? (
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {draft.descricaoServicos}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 italic">Não informado.</p>
            )}
          </DocSection>

          <DocDivider />

          {/* 4. Honorários */}
          <DocSection title="IV — Honorários propostos">
            <div className="rounded-xl border border-border bg-muted overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-400">Item</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-400">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2.5 text-zinc-300">Honorários periciais</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">
                      {formatCurrency(draft.valorHonorarios)}
                    </td>
                  </tr>
                  {draft.custoDeslocamento != null && (
                    <tr>
                      <td className="px-4 py-2.5 text-zinc-300">Custo de deslocamento</td>
                      <td className="px-4 py-2.5 text-right font-medium text-foreground">
                        {formatCurrency(draft.custoDeslocamento)}
                      </td>
                    </tr>
                  )}
                  {draft.horasTecnicas != null && (
                    <tr>
                      <td className="px-4 py-2.5 text-zinc-400 text-xs">
                        Horas técnicas estimadas
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-zinc-400">
                        {draft.horasTecnicas}h
                      </td>
                    </tr>
                  )}
                </tbody>
                {(draft.valorHonorarios != null || draft.custoDeslocamento != null) && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-card">
                      <td className="px-4 py-3 text-sm font-bold text-foreground">Total</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-emerald-700">
                        {formatCurrency(totalHonorarios)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </DocSection>

          <DocDivider />

          {/* 5. Prazo */}
          <DocSection title="V — Prazo estimado">
            <p className="text-sm text-zinc-300">
              {draft.prazoEstimado || '—'}
            </p>
          </DocSection>

          {/* 6. Observações (conditional) */}
          {draft.observacoes && (
            <>
              <DocDivider />
              <DocSection title="VI — Observações">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {draft.observacoes}
                </p>
              </DocSection>
            </>
          )}

          {/* 7. Complexidade (conditional) */}
          {draft.complexidadeNota && (
            <>
              <DocDivider />
              <DocSection title="Nota de complexidade">
                <p className="text-sm text-zinc-300">{draft.complexidadeNota}</p>
              </DocSection>
            </>
          )}

          <DocDivider />

          {/* 8. Signature block */}
          <div className="pt-2 space-y-8">
            <p className="text-xs text-zinc-400 text-center">
              O signatário declara que as informações acima são verídicas e propõe os honorários indicados
              para a realização dos serviços periciais descritos neste documento.
            </p>
            <div className="flex justify-center">
              <div className="text-center space-y-1 min-w-[260px]">
                <div className="border-b border-slate-400 pb-1 mt-10" />
                <p className="text-sm font-semibold text-foreground">{draft.peritoNome || '___________________________'}</p>
                {draft.peritoQualificacao && (
                  <p className="text-xs text-zinc-400">{draft.peritoQualificacao}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {formatDate(draft.dataProposta)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Document footer ────────────────────────────────────────────── */}
        <div className="px-8 py-4 border-t border-border bg-muted flex items-center justify-between">
          <p className="text-[10px] text-zinc-500">
            Gerado via PeriLaB · {new Date().toLocaleDateString('pt-BR')}
          </p>
          {(() => {
            const s = PROPOSTA_STATUS[draft.status] ?? PROPOSTA_STATUS.rascunho
            return (
              <span className={`text-[10px] font-semibold uppercase tracking-wider border rounded px-2 py-0.5 ${s.badge}`}>
                {s.label}
              </span>
            )
          })()}
        </div>

      </div>

      {/* ── Bottom actions ──────────────────────────────────────────────────── */}
      <div className="print:hidden flex flex-wrap items-center gap-3 pt-1">
        <Link
          href={`/pericias/${p.id}/proposta`}
          className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-zinc-400 font-medium text-sm px-4 py-2.5 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Editar proposta
        </Link>
        <PropostaExportBtn draft={exportData} />
      </div>

    </div>
  )
}
