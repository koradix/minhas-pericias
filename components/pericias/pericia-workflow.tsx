'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'
import { buscarDocumentosNomeacao, listarDocumentosNomeacao } from '@/lib/actions/nomeacoes-documentos'
import type { ProcessoDocumentoRow } from '@/lib/actions/nomeacoes-documentos'
import {
  ExternalLink,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tribunal portal URLs ──────────────────────────────────────────────────────

const TRIBUNAL_URLS: Record<string, { url: string; label: string }> = {
  TJRJ:  { url: 'https://www3.tjrj.jus.br/ejud/ConsultaProcesso.aspx',          label: 'Portal TJRJ' },
  TJSP:  { url: 'https://esaj.tjsp.jus.br/cpopg/open.do',                       label: 'SAJ TJSP'   },
  TJMG:  { url: 'https://www4.tjmg.jus.br/juridico/sf/proc_resultado.jsp',      label: 'Portal TJMG' },
  TJRS:  { url: 'https://www.tjrs.jus.br/novo/',                                label: 'Portal TJRS' },
  TJPR:  { url: 'https://projudi.tjpr.jus.br/projudi/',                         label: 'Projudi TJPR'},
  TJSC:  { url: 'https://esaj.tjsc.jus.br/cpopg/open.do',                       label: 'SAJ TJSC'   },
  TJBA:  { url: 'https://esaj.tjba.jus.br/cpopg/open.do',                       label: 'SAJ TJBA'   },
  TJPE:  { url: 'https://srv01.tjpe.jus.br/consultaprocessual/',                 label: 'Portal TJPE' },
  TJGO:  { url: 'https://projudi.tjgo.jus.br/',                                  label: 'Projudi TJGO'},
  TJMT:  { url: 'https://pje.tjmt.jus.br/',                                     label: 'PJe TJMT'   },
  TJMS:  { url: 'https://esaj.tjms.jus.br/cpopg5/open.do',                      label: 'SAJ TJMS'   },
  TJCE:  { url: 'https://esaj.tjce.jus.br/cpopg/open.do',                       label: 'SAJ TJCE'   },
  TJAM:  { url: 'https://consultasaj.tjam.jus.br/cpopg/open.do',                label: 'SAJ TJAM'   },
  TJPA:  { url: 'https://www.tjpa.jus.br/',                                     label: 'Portal TJPA' },
  TJES:  { url: 'https://sistemas.tjes.jus.br/pes/',                            label: 'Portal TJES' },
  DJRJ:  { url: 'https://www3.tjrj.jus.br/ejud/ConsultaProcesso.aspx',          label: 'Portal TJRJ' },
  DJSP:  { url: 'https://esaj.tjsp.jus.br/cpopg/open.do',                       label: 'SAJ TJSP'   },
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AnaliseIA {
  numeroProcesso?: string | null
  autor?: string | null
  reu?: string | null
  vara?: string | null
  tribunal?: string | null
  resumoProcesso?: { tipoAcao?: string; objetoDisputa?: string } | null
  nomeacaoDespacho?: { quesitos?: string[]; determinacaoJuiz?: string } | null
  aceiteHonorarios?: { complexidade?: string; valorSugerido?: string | null } | null
}

interface Props {
  periciaId: string
  tribunalSigla: string
  processoNumero: string | null
  hasAnalise: boolean
  analiseInicial: AnaliseIA | null
  nomeacaoId?: string | null
}

type EscavadorFase =
  | { fase: 'idle' }
  | { fase: 'buscando' }
  | { fase: 'aguardando' }
  | { fase: 'found'; docs: ProcessoDocumentoRow[] }
  | { fase: 'nenhum' }
  | { fase: 'erro'; mensagem: string }

type UploadState =
  | { fase: 'idle' }
  | { fase: 'uploading'; progresso: string }
  | { fase: 'ok'; analise: AnaliseIA; nomeacaoId: string }
  | { fase: 'erro'; mensagem: string }

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ done, active, num }: { done: boolean; active: boolean; num: number }) {
  if (done) return <CheckCircle2 className="h-7 w-7 text-[#416900] flex-shrink-0" />
  if (active) return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#416900] bg-[#f4fce3] text-[13px] font-bold text-[#416900] flex-shrink-0">
      {num}
    </span>
  )
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white text-[13px] font-bold text-[#d1d5db] flex-shrink-0">
      {num}
    </span>
  )
}

// ─── Análise result card (compact — full data shown in PericiaEditCard below) ──

function AnaliseCard({ analise }: { analise: AnaliseIA }) {
  const tipo = analise.resumoProcesso?.tipoAcao ?? analise.nomeacaoDespacho?.determinacaoJuiz ?? null
  const partes = [analise.autor, analise.reu].filter(Boolean).join(' × ') || null
  const quesitosCount = analise.nomeacaoDespacho?.quesitos?.length ?? 0

  return (
    <div className="rounded-lg border border-[#d8f5a2] bg-[#f4fce3] p-5 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-5 w-5 text-[#416900] flex-shrink-0" />
        <p className="text-[15px] font-semibold text-[#416900] font-manrope">
          Análise concluída
          {quesitosCount > 0 && (
            <span className="ml-2 font-normal text-[#416900]/70 text-[13px]">
              · {quesitosCount} quesito{quesitosCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
      {tipo && <p className="text-[14px] text-[#374151] pl-8 font-inter">{tipo}</p>}
      {partes && <p className="text-[14px] text-[#6b7280] pl-8 font-inter">{partes}</p>}
      <p className="text-[13px] text-[#416900]/80 pl-8 font-medium font-inter">
        Use o botão &quot;Usar dados da IA&quot; abaixo para preencher os campos da perícia.
      </p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PericiaWorkflow({
  periciaId,
  tribunalSigla,
  processoNumero,
  hasAnalise,
  analiseInicial,
  nomeacaoId,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ fase: 'idle' })
  const [step1Done, setStep1Done] = useState(false)
  const [escavadorMode, setEscavadorMode] = useState(false)
  const [escavadorFase, setEscavadorFase] = useState<EscavadorFase>({ fase: 'idle' })
  const [isPendingEscavador, startEscavador] = useTransition()
  const router = useRouter()

  const tribunal = TRIBUNAL_URLS[tribunalSigla.toUpperCase()]
  const analise: AnaliseIA | null =
    uploadState.fase === 'ok' ? uploadState.analise : analiseInicial

  const analiseFeita = hasAnalise || uploadState.fase === 'ok'

  async function sendToApi(blobUrl: string, file: File) {
    const res = await fetch('/api/nomeacoes/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blobUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        tribunal: tribunalSigla,
        numero:   processoNumero,
        periciaId,
      }),
    })
    const json = await res.json() as { ok: boolean; message?: string; nomeacaoId?: string; preview?: AnaliseIA }

    if (!json.ok) {
      const raw = json.message ?? 'Erro ao processar documento'
      const mensagem = raw.includes('rate_limit') || raw.includes('rate limit') || raw.includes('429')
        ? 'Limite de requisições da IA atingido. Aguarde 1 minuto e tente novamente.'
        : raw.length > 200 ? raw.substring(0, 200) + '…' : raw
      setUploadState({ fase: 'erro', mensagem })
      return
    }

    const preview = json.preview ?? {}
    setUploadState({ fase: 'ok', nomeacaoId: json.nomeacaoId ?? '', analise: preview })

    const partes = [preview.autor, preview.reu].filter(Boolean).join(' × ') || undefined
    const vara   = preview.vara ?? undefined
    const previewAny = preview as Record<string, unknown>
    const end    = (previewAny.enderecoVistoria as string | null) ?? (previewAny.endereco as string | null) ?? undefined
    await atualizarDadosPericia(periciaId, {
      ...(partes ? { partes } : {}),
      ...(vara   ? { vara   } : {}),
      ...(end    ? { endereco: end } : {}),
    })
    router.refresh()
  }

  function handleBuscarEscavador() {
    if (!nomeacaoId) return
    setEscavadorFase({ fase: 'buscando' })
    startEscavador(async () => {
      const res = await buscarDocumentosNomeacao(nomeacaoId)
      if (!res.ok) { setEscavadorFase({ fase: 'erro', mensagem: res.error }); return }
      if (res.atualizacaoSolicitada) { setEscavadorFase({ fase: 'aguardando' }); return }
      if (!res.suportado || res.total === 0) { setEscavadorFase({ fase: 'nenhum' }); return }
      const docs = await listarDocumentosNomeacao(nomeacaoId)
      setEscavadorFase(docs.length > 0 ? { fase: 'found', docs } : { fase: 'nenhum' })
    })
  }

  async function handleAnalisarDocEscavador(doc: ProcessoDocumentoRow) {
    setUploadState({ fase: 'uploading', progresso: 'Baixando do Escavador…' })
    try {
      const res = await fetch(`/api/nomeacoes/doc-download?docId=${doc.id}`)
      if (!res.ok) throw new Error(`Erro ao baixar: HTTP ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], doc.nome.replace(/[^a-zA-Z0-9._\- ]/g, '_') + '.pdf', { type: 'application/pdf' })
      setUploadState({ fase: 'uploading', progresso: 'Enviando para análise…' })
      const blobUrl = await uploadFile(file, (pct) => setUploadState({ fase: 'uploading', progresso: `Enviando… ${pct}%` }))
      setUploadState({ fase: 'uploading', progresso: 'Analisando com IA…' })
      await sendToApi(blobUrl, file)
    } catch (err) {
      setUploadState({ fase: 'erro', mensagem: err instanceof Error ? err.message : 'Erro ao processar documento' })
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    setUploadState({ fase: 'uploading', progresso: 'Enviando arquivo…' })

    // ── Upload chunked (mesmo domínio, sem CORS, sem limite de tamanho) ────────
    let blobUrl: string
    try {
      blobUrl = await uploadFile(file, (pct) => {
        setUploadState({ fase: 'uploading', progresso: `Enviando… ${pct}%` })
      })
    } catch (err) {
      setUploadState({
        fase: 'erro',
        mensagem: err instanceof Error ? err.message : 'Erro ao enviar arquivo. Tente novamente.',
      })
      return
    }

    // ── IA: servidor baixa do Blob, analisa, deleta ───────────────────────────
    setUploadState({ fase: 'uploading', progresso: 'Analisando com IA…' })
    await sendToApi(blobUrl, file)
  }

  const steps = [
    { num: 1, done: step1Done || analiseFeita },
    { num: 2, done: analiseFeita },
    { num: 3, done: analiseFeita },
  ]

  const activeStep = steps.find((s) => !s.done)?.num ?? 3

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5">
        <h2 className="text-[16px] font-semibold text-[#1f2937] font-manrope">Próximos passos</h2>
        {analiseFeita && (
          <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#416900] bg-[#f4fce3] border border-[#d8f5a2] rounded-md px-2.5 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Concluído
          </span>
        )}
      </div>

      <div className="divide-y divide-[#f2f3f9]">

        {/* ── Step 1: Acessar tribunal ─────────────────────────────────────── */}
        <div className={cn('px-6 py-5 flex gap-4', step1Done || analiseFeita ? 'opacity-60' : '')}>
          <StepDot done={step1Done || analiseFeita} active={activeStep === 1} num={1} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
              Baixe o processo no portal do tribunal
            </p>
            <p className="text-[14px] text-[#6b7280] mt-1 font-inter">
              Acesse o portal, localize o processo pelo número e baixe o PDF da nomeação.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tribunal ? (
                <a
                  href={tribunal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setStep1Done(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] px-3 py-2 text-[13px] font-semibold text-[#374151] transition-all"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                  {tribunal.label}
                </a>
              ) : (
                <p className="text-[14px] text-[#9ca3af] italic font-inter">
                  Acesse o portal do {tribunalSigla} e procure pelo número {processoNumero ?? 'do processo'}.
                </p>
              )}
              {processoNumero && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#f2f3f9] border border-[#e2e8f0] px-3 py-2 text-[13px] font-mono text-[#374151]">
                  {processoNumero}
                </span>
              )}
            </div>
            {!step1Done && !analiseFeita && (
              <button
                onClick={() => setStep1Done(true)}
                className="mt-3 text-[13px] text-[#9ca3af] hover:text-[#374151] underline underline-offset-2 transition-colors"
              >
                Já baixei o documento
              </button>
            )}
          </div>
        </div>

        {/* ── Step 2: Documento para análise ──────────────────────────────── */}
        <div className={cn('px-6 py-5 flex gap-4', !step1Done && !analiseFeita ? 'opacity-50 pointer-events-none' : '')}>
          <StepDot done={analiseFeita} active={activeStep === 2} num={2} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
              Suba o documento para análise da IA
            </p>
            <p className="text-[14px] text-[#6b7280] mt-1 font-inter">
              Envie o PDF ou busque direto via Escavador. A IA extrai partes, vara, quesitos e complexidade.
            </p>

            {uploadState.fase === 'idle' && !analiseFeita && (
              <div className="mt-4 space-y-3">
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />

                {/* Mode toggle */}
                <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] p-1 w-fit">
                  <button
                    onClick={() => setEscavadorMode(false)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all',
                      !escavadorMode ? 'bg-[#1f2937] text-white' : 'text-[#6b7280] hover:text-[#374151]',
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload manual
                  </button>
                  {nomeacaoId && (
                    <button
                      onClick={() => setEscavadorMode(true)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all',
                        escavadorMode ? 'bg-[#1f2937] text-white' : 'text-[#6b7280] hover:text-[#374151]',
                      )}
                    >
                      <Search className="h-3.5 w-3.5" /> Buscar Escavador
                    </button>
                  )}
                </div>

                {/* Manual upload */}
                {!escavadorMode && (
                  <div className="space-y-1">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] hover:bg-[#374151] px-4 py-2.5 text-[14px] font-semibold text-white transition-all"
                    >
                      <Upload className="h-4 w-4" /> Selecionar PDF ou DOCX
                    </button>
                    <p className="text-[12px] text-[#9ca3af] font-inter">Máx. 50 MB · PDF ou DOCX</p>
                  </div>
                )}

                {/* Escavador mode */}
                {escavadorMode && (
                  <div className="space-y-3">
                    {escavadorFase.fase === 'idle' && (
                      <button
                        onClick={handleBuscarEscavador}
                        disabled={isPendingEscavador}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition-all disabled:opacity-50"
                      >
                        <Search className="h-4 w-4" /> Buscar documentos no Escavador
                      </button>
                    )}

                    {(escavadorFase.fase === 'buscando' || isPendingEscavador) && (
                      <div className="flex items-center gap-2 text-[14px] text-[#6b7280]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#416900]" />
                        Buscando documentos…
                      </div>
                    )}

                    {escavadorFase.fase === 'aguardando' && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 space-y-2">
                        <p className="text-[13px] text-blue-700 font-semibold">Robôs Escavador acionados</p>
                        <p className="text-[13px] text-blue-600">Os documentos estão sendo coletados. Clique novamente em alguns instantes.</p>
                        <button onClick={handleBuscarEscavador} disabled={isPendingEscavador} className="text-[13px] text-blue-600 underline underline-offset-2 disabled:opacity-50">
                          Tentar novamente
                        </button>
                      </div>
                    )}

                    {escavadorFase.fase === 'nenhum' && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                        <p className="text-[13px] text-amber-700">Nenhum documento encontrado via Escavador. Use o upload manual.</p>
                      </div>
                    )}

                    {escavadorFase.fase === 'erro' && (
                      <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
                        <p className="text-[13px] text-rose-700">{escavadorFase.mensagem}</p>
                      </div>
                    )}

                    {escavadorFase.fase === 'found' && (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wider">
                          {escavadorFase.docs.length} documento{escavadorFase.docs.length !== 1 ? 's' : ''} encontrado{escavadorFase.docs.length !== 1 ? 's' : ''}
                        </p>
                        {escavadorFase.docs.map((doc) => (
                          <div key={doc.id} className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-4 py-3">
                            <FileText className="h-4 w-4 text-[#9ca3af] flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-[#1f2937] leading-snug truncate">{doc.nome}</p>
                              {doc.dataPublicacao && (
                                <p className="flex items-center gap-1 text-[11px] text-[#9ca3af] mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  {doc.dataPublicacao.split('-').reverse().join('/')}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleAnalisarDocEscavador(doc)}
                              className="flex items-center gap-1 flex-shrink-0 rounded-md bg-[#416900] hover:bg-[#2d4a00] text-white text-[12px] font-semibold px-3 py-1.5 transition-all"
                            >
                              Analisar <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {uploadState.fase === 'uploading' && (
              <div className="mt-4 flex items-center gap-2.5 text-[14px] text-[#6b7280] font-inter">
                <Loader2 className="h-4 w-4 animate-spin text-[#416900] flex-shrink-0" />
                {uploadState.progresso}
              </div>
            )}

            {uploadState.fase === 'erro' && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-rose-700 font-inter">{uploadState.mensagem}</p>
                  <button
                    onClick={() => { setUploadState({ fase: 'idle' }); if (fileRef.current) fileRef.current.value = '' }}
                    className="mt-1.5 text-[13px] text-rose-500 hover:text-rose-700 underline underline-offset-2"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Resultado IA ─────────────────────────────────────────── */}
        <div className="px-6 py-5 flex gap-4">
          <StepDot done={analiseFeita} active={activeStep === 3} num={3} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
              Resultado da análise
            </p>
            {!analiseFeita && uploadState.fase !== 'uploading' && (
              <p className="text-[14px] text-[#9ca3af] mt-1 font-inter">
                Aguardando documento para análise.
              </p>
            )}
            {uploadState.fase === 'uploading' && (
              <div className="mt-2 flex items-center gap-2.5 text-[14px] text-[#6b7280] font-inter">
                <Loader2 className="h-4 w-4 animate-spin text-[#416900] flex-shrink-0" />
                Processando…
              </div>
            )}
            {analise && (
              <div className="mt-4">
                <AnaliseCard analise={analise} />
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
