export const maxDuration = 30

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
} from 'lucide-react'
import { auth } from '@/auth'
import { PericiaMediaSection } from '@/components/pericias/pericia-media-section'
// import { ResumoBlock } from '@/components/processos/resumo-block'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getMidiasByPericiaId, type MidiaDaPericia } from '@/lib/data/checkpoint-media'
import { pericias, statusMapPericias } from '@/lib/mocks/pericias'
import { PericiaDetailTabs } from '@/components/pericias/pericia-detail-tabs'
// import { PericiaWorkflow } from '@/components/pericias/pericia-workflow'
import { PericiaHeaderEdit } from '@/components/pericias/pericia-header-edit'
import { getFeeProposal, getFeeProposalVersions } from '@/lib/actions/fee-proposal'
import { getAgendaItems, autoPopulateAgenda } from '@/lib/actions/agenda'
// AgendaPanel is rendered only inside the Agenda tab
import { getProposalTemplates } from '@/lib/actions/proposal-template'
import { getLaudoTemplates, getLaudoDraft } from '@/lib/actions/laudo'
import type { ResumoData } from '@/lib/actions/processos-intake'
import { isAnaliseProcessoV2, toAnaliseCompativel } from '@/lib/ai/prompt-mestre-resumo'
import { AnaliseProcessoV2Block } from '@/components/nomeacoes/analise-processo-v2-block'
import { AnaliseProcessoBlock } from '@/components/nomeacoes/analise-processo-block'
import { NomeacaoDocumentosSection } from '@/components/nomeacoes/nomeacao-documentos'
import {
  getPericiaAssunto, getRotaTitulo, getPericiaById, getRotaById,
  getIntakeByPericiaId, getNomeacaoByPericiaId, getCitacaoByPericiaId,
  getCheckpointsComMidias, getVistoriaInfo, getPeritoPerfil,
  type PericiaRow, type NomeacaoLink, type CpRow,
} from '@/lib/data/pericias'
import type { MidiaRow } from '@/lib/data/pericias'

import type { Metadata } from 'next'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function isMockId(id: string): boolean {
  return /^\d+$/.test(id)
}

// ─── Types (importados de @/lib/data/pericias) ──────────────────────────────

// ─── Status maps ──────────────────────────────────────────────────────────────

const ROTA_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' }> = {
  em_andamento: { label: 'Em andamento', variant: 'info'      },
  concluida:    { label: 'Concluída',    variant: 'success'   },
  cancelada:    { label: 'Cancelada',    variant: 'secondary' },
}

const PERICIA_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' }> = {
  planejada:          { label: 'Planejada',          variant: 'secondary' },
  em_andamento:       { label: 'Em andamento',       variant: 'info'      },
  concluida:          { label: 'Concluída',          variant: 'success'   },
  cancelada:          { label: 'Cancelada',          variant: 'secondary' },
  processo_importado: { label: 'Processo importado', variant: 'info'      },
}

const CP_STATUS_TEXT: Record<string, string> = {
  concluido: 'CONCLUÍDO',
  chegou:    'CHEGOU',
  pendente:  'PENDENTE',
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (isMockId(id)) {
    const p = pericias.find((x) => x.id === parseInt(id, 10))
    return { title: p ? p.assunto : 'Perícia' }
  }
  let title = 'Perícia'
  try {
    const assunto = await getPericiaAssunto(id)
    if (assunto) return { title: assunto }
    const titulo = await getRotaTitulo(id)
    if (titulo) title = titulo
  } catch {}
  return { title }
}

// ─── Mock pericia view ────────────────────────────────────────────────────────

async function MockPericiaView({ id, userId }: { id: string; userId: string }) {
  const mockIndex = parseInt(id, 10)
  const p = pericias.find((x) => x.id === mockIndex)
  if (!p) notFound()

  const st = statusMapPericias[p.status]

  let midias: MidiaDaPericia[] = []
  try {
    midias = await getMidiasByPericiaId(id, userId)
  } catch {}

  return (
    <div className="space-y-0 pb-10">
      {/* ─── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Link href="/pericias" className="hover:text-slate-900 transition-colors">Perícias</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900 truncate max-w-xs">{p.assunto}</span>
      </div>

      {/* ─── Header Card (Full Width) ───────────────────────────────────────── */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{p.numero}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Prazo: {p.prazo}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">{p.assunto}</h1>
            </div>
            {st && (
              <Badge variant={st.variant} className="rounded-none text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border-2">
                {st.label}
              </Badge>
            )}
          </div>
        </div>

        {/* ─── Meta Bar (High Contrast Highlight) ────────────────────────────── */}
        <div className="border-t border-slate-200 bg-slate-900">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800">
            {[
              { label: 'Processo', value: p.processo, highlight: true },
              { label: 'Registros', value: `${midias.length} arquivos` },
              { label: 'Vara', value: p.vara },
              { label: 'Honorários', value: p.valor, lime: true },
            ].map((m, i) => (
              <div key={i} className="bg-slate-900 px-6 py-5 flex flex-col gap-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">{m.label}</p>
                <p className={cn(
                  "text-[12px] font-bold tracking-wider",
                  m.lime ? "text-[#a3e635]" : "text-white",
                  m.highlight ? "font-mono" : ""
                )}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
             <section className="space-y-6">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Dados Técnicos — Amostra</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 border border-slate-100">
                   <div className="bg-white p-6 space-y-1.5">
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Parte Solicitante</p>
                     <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{p.cliente}</p>
                   </div>
                   <div className="bg-white p-6 space-y-1.5">
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tipo de Perícia</p>
                     <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">Grafotécnica</p>
                   </div>
                   {p.endereco && (
                     <div className="bg-white p-6 space-y-1.5 md:col-span-2 border-l-4 border-[#a3e635]">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Localização da Vistoria</p>
                       <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                         {p.endereco}
                       </p>
                     </div>
                   )}
                </div>
             </section>

             <section className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Acervo de Evidências</h2>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{midias.length} ITENS</span>
               </div>
               <div className="border border-slate-200">
                 <PericiaMediaSection pericoId={id} midias={midias} />
               </div>
             </section>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Ações Disponíveis</h2>
              <div className="space-y-4">
                <Link href={`/rotas/pericias`} className="block">
                  <button className="w-full bg-slate-900 text-white rounded-none px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all text-center">
                    Executar Rota de Vistoria
                  </button>
                </Link>
                <Link href={`/pericias/${id}/proposta`} className="block">
                  <button className="w-full bg-white border-2 border-slate-900 text-slate-900 rounded-none px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-50 transition-all text-center">
                    Gerenciar Proposta
                  </button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Real Pericia view ────────────────────────────────────────────────────────

async function RealPericiaView({ pericia }: { pericia: PericiaRow }) {
  // Fetch all related data via data layer
  const [intake, nomeacaoLink, citacaoLink, cpData, vistoriaInfo] = await Promise.all([
    getIntakeByPericiaId(pericia.id).catch(() => null),
    getNomeacaoByPericiaId(pericia.id).catch(() => null),
    getCitacaoByPericiaId(pericia.id).catch(() => null),
    getCheckpointsComMidias('periciaId', pericia.id),
    getVistoriaInfo(pericia.id),
  ])

  const { checkpoints, midias } = cpData

  // Parse resumo JSON
  let resumo: ResumoData | null = null
  if (intake?.resumo) {
    try { resumo = JSON.parse(intake.resumo) as ResumoData } catch {}
  }

  // Fetch proposal data
  const session2 = await import('@/auth').then((m) => m.auth())
  const userId2  = session2?.user?.id ?? ''

  // Parse processSummary — normalise v2 → v1-compat shape so PropostaTab always sees the same structure
  const analiseIA2: Record<string, unknown> | null = nomeacaoLink?.processSummary
    ? (() => {
        try {
          const parsed = JSON.parse(nomeacaoLink!.processSummary!) as Record<string, unknown>
          if (isAnaliseProcessoV2(parsed)) return toAnaliseCompativel(parsed) as unknown as Record<string, unknown>
          return parsed
        } catch { return null }
      })()
    : null

  const [feeProposal, feeVersoes, proposalTemplates, peritoPerfil2, , laudoTemplates, laudoDraft] = await Promise.all([
    getFeeProposal(pericia.id, userId2),
    getFeeProposalVersions(pericia.id, userId2),
    getProposalTemplates(userId2),
    getPeritoPerfil(userId2),
    getAgendaItems(pericia.id),
    getLaudoTemplates(),
    getLaudoDraft(pericia.id),
  ])

  // Auto-populate agenda (idempotent, non-blocking)
  const hasAnalise2 = !!nomeacaoLink?.extractedData
  const hasMidias2 = checkpoints.some((c) => c.midiaCount > 0)
  autoPopulateAgenda(pericia.id, {
    hasAnalise: hasAnalise2,
    hasProposta: !!feeProposal,
    hasVistoria: checkpoints.length > 0,
    hasMidias: hasMidias2,
    periciaStatus: pericia.status,
  }).catch(() => {})

  const st = PERICIA_STATUS[pericia.status] ?? { label: pericia.status, variant: 'secondary' as const }
  const concluidos = checkpoints.filter((c) => c.status === 'concluido').length
  const total = checkpoints.length

  return (
    <div className="space-y-0 pb-10">
      {/* ─── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Link href="/pericias" className="hover:text-slate-900 transition-colors uppercase">Perícias</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900 truncate max-w-xs">{pericia.assunto}</span>
      </div>

      {/* ─── Header Card (Full Width Content) ────────────────────────────────── */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-10">
           <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{pericia.numero}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{pericia.tipo}</span>
                {pericia.prazo && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prazo: {pericia.prazo}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight max-w-4xl">
                {pericia.assunto}
              </h1>
            </div>
            <Badge variant={st.variant} className="rounded-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2 flex-shrink-0">
              {st.label}
            </Badge>
          </div>
        </div>

        {/* ─── Meta Bar (editável) ─────────────────────────────────────────── */}
        <PericiaHeaderEdit
          periciaId={pericia.id}
          processo={pericia.processo}
          autor={pericia.partes?.split('×')[0]?.replace(/AUTOR:\s*/i, '').trim() || null}
          reu={pericia.partes?.split('×')[1]?.replace(/R[ÉE]U:\s*/i, '').trim() || null}
          vara={pericia.vara}
          perito={session2?.user?.name ?? 'Perito'}
        />

        {/* Quick links bar */}
        {citacaoLink?.linkCitacao && (
          <div className="bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
              <a
                href={citacaoLink.linkCitacao}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
              >
                Ver no diário oficial ↗
              </a>
            </div>
          </div>
        )}

        {/* Address bar underline highlight */}
        {pericia.endereco && (
          <div className="bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-[#a3e635] pl-4">
                LOCALIZAÇÃO: {pericia.endereco}
              </p>
            </div>
          </div>
        )}

        {/* Edição de dados — integrada na meta bar do cabeçalho */}
        <div className="border-t border-slate-200">
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <Suspense>
          <PericiaDetailTabs
            periciaId={pericia.id}
            periciaStatus={pericia.status}
            enderecoPericia={pericia.endereco}
            checkpoints={checkpoints}
            hasAnalise={!!nomeacaoLink?.extractedData}
            hasProposta={!!feeProposal}
            propostaProps={{
              pericia: {
                numero:   pericia.numero,
                assunto:  pericia.assunto,
                processo: pericia.processo,
                vara:     pericia.vara,
                partes:   pericia.partes,
                tribunal: citacaoLink?.diarioSigla ?? pericia.vara?.match(/TJ[A-Z]{2}|DJ[A-Z]{2}/)?.[0] ?? 'TJRJ',
              },
              analise:         analiseIA2,
              peritoNome:      session2?.user?.name ?? '',
              peritoFormacao:  peritoPerfil2?.formacao ?? '',
              peritoRegistro:  peritoPerfil2?.registro ?? '',
              peritoEmail:     session2?.user?.email ?? '',
              peritoTelefone:  peritoPerfil2?.telefone ?? '',
              rascunho:        feeProposal,
              versoes:       feeVersoes,
              templates:     proposalTemplates,
            }}
            laudoProps={{
              pericia: {
                numero:   pericia.numero,
                assunto:  pericia.assunto,
                processo: pericia.processo,
                vara:     pericia.vara,
                partes:   pericia.partes,
                tribunal: citacaoLink?.diarioSigla ?? pericia.vara?.match(/TJ[A-Z]{2}|DJ[A-Z]{2}/)?.[0] ?? 'TJRJ',
              },
              analise: analiseIA2,
              peritoNome:     session2?.user?.name ?? '',
              peritoFormacao: peritoPerfil2?.formacao ?? '',
              templates:      laudoTemplates,
              rascunho:       laudoDraft,
              midias:         midias.map((m) => ({ tipo: m.tipo, url: m.url, texto: m.texto, descricao: m.descricao })),
              vistoriaData:   vistoriaInfo,
              documentosProcesso: [],
            }}
            resumoContent={
              <div className="space-y-10 pt-4 max-w-5xl mx-auto">

                  {/* ── PASSO 1 — Carregar documento ─────────────────────────── */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={cn(
                        'flex items-center justify-center h-7 w-7 text-[11px] font-black',
                        nomeacaoLink?.nomeArquivo ? 'bg-[#a3e635] text-slate-900' : 'bg-slate-900 text-white',
                      )}>1</span>
                      <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Carregar documento do processo</h2>
                    </div>
                    <NomeacaoDocumentosSection
                      variant="minimal"
                      nomeacaoId={nomeacaoLink?.id ?? ''}
                      tribunal={citacaoLink?.diarioSigla ?? pericia.vara?.match(/TJ[A-Z]{2}|DJ[A-Z]{2}/)?.[0] ?? 'TJRJ'}
                      numeroProcesso={pericia.processo ?? ''}
                      nomeArquivo={nomeacaoLink?.nomeArquivo ?? null}
                      periciaId={pericia.id}
                    />
                  </section>

                  {/* ── PASSO 2 — Resumo IA ──────────────────────────────────── */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={cn(
                        'flex items-center justify-center h-7 w-7 text-[11px] font-black',
                        nomeacaoLink?.processSummary ? 'bg-[#a3e635] text-slate-900' : 'bg-slate-200 text-slate-400',
                      )}>2</span>
                      <h2 className={cn(
                        'text-[12px] font-black uppercase tracking-[0.3em]',
                        nomeacaoLink?.processSummary ? 'text-slate-900' : 'text-slate-300',
                      )}>Resumo do processo</h2>
                    </div>

                    {nomeacaoLink?.processSummary ? (() => {
                      try {
                        const parsed = JSON.parse(nomeacaoLink!.processSummary!)
                        return (
                          <div className="border border-slate-900 p-8 bg-white">
                            <div className="mb-6 flex items-center justify-between">
                              <span className="bg-slate-900 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">Análise IA</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{pericia.id.slice(0,8)}</span>
                            </div>
                            {isAnaliseProcessoV2(parsed)
                              ? <AnaliseProcessoV2Block analise={parsed} />
                              : <AnaliseProcessoBlock analise={parsed} />
                            }
                          </div>
                        )
                      } catch { return null }
                    })() : (
                      <div className="border border-dashed border-slate-200 bg-slate-50 px-8 py-10 text-center">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Carregue o documento no passo 1 para gerar o resumo automaticamente
                        </p>
                      </div>
                    )}
                  </section>

                  {/* ── SEGUIR PARA PROPOSTA ──────────────────────────────────── */}
                  {nomeacaoLink?.processSummary && (
                    <section>
                      <a
                        href={`/pericias/${pericia.id}?tab=proposta`}
                        className="w-full flex items-center justify-center gap-3 bg-[#a3e635] hover:bg-[#bef264] text-slate-900 px-6 py-5 text-[12px] font-black uppercase tracking-[0.2em] transition-all"
                      >
                        Seguir para proposta de honorários →
                      </a>
                    </section>
                  )}

                  {/* 6. Últimos Registros (Mídias) */}
                  {midias.length > 0 && (
                    <section className="space-y-6 pt-12 border-t border-slate-100">
                       <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Últimos Registros Fotográficos</h2>
                       <div className="border border-slate-200">
                         <PericiaMediaSection pericoId={pericia.id} midias={midias.slice(0, 4)} />
                       </div>
                    </section>
                  )}

                  {/* Cronologia — sutil no final */}
                  <div className="pt-8 mt-8 border-t border-slate-100/50">
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {[
                        nomeacaoLink ? `Nomeação ${formatDate(toISO(nomeacaoLink.criadoEm))}` : null,
                        `Aberto ${formatDate(toISO(pericia.criadoEm))}`,
                        concluidos > 0 ? 'Vistoria realizada' : null,
                        pericia.status === 'concluida' ? 'Laudo entregue' : null,
                      ].filter(Boolean).map((step, i, arr) => (
                        <span key={i} className="flex items-center gap-3">
                          <span className={cn('h-1.5 w-1.5 rounded-full', i < arr.length ? 'bg-slate-200' : 'bg-slate-100')} />
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
              </div>
            }
            fotosContent={
              <section className="pt-6">
                <div className="border border-slate-200">
                   <PericiaMediaSection pericoId={pericia.id} midias={midias} />
                </div>
              </section>
            }
          />
        </Suspense>

      </div>
    </div>
  )
}

// ─── RotaPericia view ─────────────────────────────────────────────────────────

async function RotaPericiaView({ id, userId }: { id: string; userId: string }) {
  const rota = await getRotaById(id)
  if (!rota || rota.peritoId !== userId) notFound()

  const { checkpoints, midias } = await getCheckpointsComMidias('rotaId', id)

  const rotaStatus = ROTA_STATUS[rota.status] ?? { label: rota.status, variant: 'secondary' as const }
  const concluidos = checkpoints.filter((c) => c.status === 'concluido').length
  const total = checkpoints.length
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const criadoEm = formatDate(toISO(rota.criadoEm))

  return (
    <div className="space-y-0 pb-10">
      {/* ─── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Link href="/pericias" className="hover:text-slate-900 transition-colors uppercase">Perícias</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900 truncate max-w-xs">{rota.titulo}</span>
      </div>

      {/* ─── Header Card ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CRIADA EM {criadoEm}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight max-w-4xl">{rota.titulo}</h1>
            </div>
            <Badge variant={rotaStatus.variant} className="rounded-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2">
              {rotaStatus.label}
            </Badge>
          </div>
        </div>

        {/* ─── Meta Bar ────────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-200 bg-slate-900">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-800">
            {[
              { label: 'Checkpoints', value: `${total} paradas` },
              { label: 'Progresso', value: `${concluidos}/${total} (${pct}%)`, lime: true },
              { label: 'Registros', value: `${midias.length} arquivos` },
            ].map((m, i) => (
              <div key={i} className="bg-slate-900 px-6 py-6 flex flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{m.label}</p>
                <p className={cn(
                  "text-[13px] font-bold tracking-tight uppercase",
                  m.lime ? "text-[#a3e635]" : "text-white"
                )}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar accent */}
        {total > 0 && (
          <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#a3e635] transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-16">
            {/* Checkpoints list */}
            <section className="space-y-6">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Checkpoints da Rota</h2>
              <div className="border border-slate-200">
                {checkpoints.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma parada planejada.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {checkpoints.map((cp) => (
                      <div key={cp.id} className="flex items-start gap-6 px-8 py-6 bg-white hover:bg-slate-50 transition-colors">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2",
                          cp.status === 'concluido' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-300 border-slate-100"
                        )}>
                          {CP_STATUS_TEXT[cp.status] ?? 'PENDENTE'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-[13px] font-black uppercase tracking-tight',
                            cp.status === 'concluido' ? 'text-slate-400' : 'text-slate-900',
                          )}>
                            {cp.titulo}
                          </p>
                          {cp.endereco && (
                            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{cp.endereco}</p>
                          )}
                        </div>
                        {cp.midiaCount > 0 && (
                          <span className="text-[9px] font-black text-[#a3e635] border border-[#a3e635] px-2 py-0.5 uppercase tracking-widest">
                            {cp.midiaCount} EVIDENCE
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Media gallery */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Registros Coletados</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{midias.length} mídias</span>
              </div>
              <div className="border border-slate-200">
                <PericiaMediaSection pericoId={id} midias={midias} />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-12">
            <section className="space-y-6">
               <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Operações</h2>
               <div className="space-y-4">
                  {rota.status !== 'concluida' && (
                    <Link href={`/rotas/pericias`} className="block">
                      <button className="w-full bg-[#a3e635] text-slate-900 rounded-none px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#bef264] transition-all shadow-none">
                        Continuar Execução
                      </button>
                    </Link>
                  )}
                  <Link href="/documentos/modelos" className="block">
                    <button className="w-full bg-white border-2 border-slate-200 text-slate-900 rounded-none px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:border-slate-900 transition-all text-center">
                      Gerar Documento Final
                    </button>
                  </Link>
               </div>
            </section>

            <div className="border border-slate-100 bg-slate-50 p-8 space-y-4">
               <div className="space-y-1">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status da Rota</p>
                 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{rotaStatus.label}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Última Atualização</p>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{formatDate(toISO(rota.atualizadoEm))}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PericiaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  // ── Mock pericia (numeric ID) ───────────────────────────────────────────────
  if (isMockId(id)) {
    return <MockPericiaView id={id} userId={userId} />
  }

  // ── Real Pericia (from intake flow) ────────────────────────────────────────
  let pericia: PericiaRow | null = null
  try {
    pericia = await getPericiaById(id)
  } catch {}

  if (pericia && pericia.peritoId === userId) {
    try {
      return await RealPericiaView({ pericia })
    } catch (err) {
      console.error('[PericiaDetailPage] render error:', err)
      return (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Erro ao carregar perícia</h1>
          <p className="text-sm text-slate-500">{pericia.numero} — {pericia.assunto}</p>
          <p className="text-xs text-rose-500">{err instanceof Error ? err.message : 'Erro interno'}</p>
        </div>
      )
    }
  }

  // ── RotaPericia fallback ────────────────────────────────────────────────────
  return <RotaPericiaView id={id} userId={userId} />
}
