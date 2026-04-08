'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'
import { buscarDocumentosPorPericia, listarDocumentosPorPericia, sugerirProcessosSemCNJ, vincularProcessoPericia } from '@/lib/actions/nomeacoes-documentos'
import type { ProcessoDocumentoRow, ProcessoSugestao } from '@/lib/actions/nomeacoes-documentos'
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
  | { fase: 'buscando_processo' }
  | { fase: 'escolher_processo'; sugestoes: ProcessoSugestao[] }
  | { fase: 'nenhum_processo' }

type UploadState =
  | { fase: 'idle' }
  | { fase: 'uploading'; progresso: string }
  | { fase: 'ok'; analise: AnaliseIA; nomeacaoId: string }
  | { fase: 'erro'; mensagem: string }

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ done, active, num }: { done: boolean; active: boolean; num: number }) {
  if (done) return <CheckCircle2 className="h-8 w-8 text-lime-500 flex-shrink-0" />
  if (active) return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-900 text-[11px] font-black text-white flex-shrink-0">
      {num}
    </span>
  )
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-[11px] font-black text-slate-300 flex-shrink-0">
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
    <div className="rounded-xl border border-lime-200 bg-lime-50/40 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-lime-600 flex-shrink-0" />
        <p className="text-sm font-bold text-slate-900">
          Análise concluída
          {quesitosCount > 0 && (
            <span className="ml-3 font-medium text-slate-400 normal-case tracking-normal">
              · {quesitosCount} quesito{quesitosCount > 1 ? 's' : ''} identificado{quesitosCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
      {tipo && <p className="text-[14px] text-slate-600 pl-8 font-medium leading-relaxed">{tipo}</p>}
      {partes && <p className="text-[13px] text-slate-400 pl-8 font-medium italic">{partes}</p>}
      <div className="pt-2 pl-8">
        <p className="text-[11px] font-bold text-slate-900 bg-lime-500 inline-block rounded px-2 py-1">
          Dados extraídos com sucesso
        </p>
      </div>
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
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ fase: 'idle' })
  const [step1Done, setStep1Done] = useState(false)
  const [escavadorFase, setEscavadorFase] = useState<EscavadorFase>({ fase: 'idle' })
  const [isPendingEscavador, startEscavador] = useTransition()
  const [cnj, setCnj] = useState<string | null>(processoNumero)
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

  // Busca com CNJ conhecido
  function handleBuscarEscavador() {
    setEscavadorFase({ fase: 'buscando' })
    startEscavador(async () => {
      const res = await buscarDocumentosPorPericia(periciaId)
      if (!res.ok) { setEscavadorFase({ fase: 'erro', mensagem: res.error }); return }
      if (res.atualizacaoSolicitada) { setEscavadorFase({ fase: 'aguardando' }); return }
      if (!res.suportado || res.total === 0) { setEscavadorFase({ fase: 'nenhum' }); return }
      const docs = await listarDocumentosPorPericia(periciaId)
      setEscavadorFase(docs.length > 0 ? { fase: 'found', docs } : { fase: 'nenhum' })
    })
  }

  // Busca por nome quando não há CNJ
  function handleBuscarPorNome() {
    setEscavadorFase({ fase: 'buscando_processo' })
    startEscavador(async () => {
      const res = await sugerirProcessosSemCNJ(periciaId)
      if (!res.ok) { setEscavadorFase({ fase: 'erro', mensagem: res.error }); return }
      if (res.processos.length === 0) { setEscavadorFase({ fase: 'nenhum_processo' }); return }
      setEscavadorFase({ fase: 'escolher_processo', sugestoes: res.processos })
    })
  }

  // Vincula CNJ selecionado à perícia e inicia busca de docs
  async function handleSelecionarProcesso(sugestao: ProcessoSugestao) {
    const vinc = await vincularProcessoPericia(periciaId, sugestao.cnj)
    if (!vinc.ok) { setEscavadorFase({ fase: 'erro', mensagem: vinc.error ?? 'Erro ao vincular' }); return }
    setCnj(sugestao.cnj)
    router.refresh()
    handleBuscarEscavador()
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
    <section className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-8 py-6 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Fluxo de Trabalho</h2>
        {analiseFeita && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 bg-lime-500 rounded-lg px-3 py-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">

        {/* ── Step 1: Obter documento do processo ──────────────────────────── */}
        <div className="px-8 py-6 flex gap-5">
          <StepDot done={step1Done || analiseFeita} active={activeStep === 1} num={1} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Obter documento
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Busque automaticamente ou acesse o portal do tribunal para baixar a nomeação.
            </p>

            {/* ── Busca automática de documentos ─────────────────────────────── */}
            <div className="mt-6 space-y-3">

              {/* Sem CNJ: botão para buscar por nome */}
              {escavadorFase.fase === 'idle' && !analiseFeita && !cnj && (
                <button
                  onClick={handleBuscarPorNome}
                  disabled={isPendingEscavador}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 px-5 py-2.5 text-sm font-bold text-slate-900 transition-all disabled:opacity-50"
                >
                  <Search className="h-4 w-4" /> Buscar nomeações no Escavador
                </button>
              )}

              {/* Com CNJ: botão para buscar documentos */}
              {escavadorFase.fase === 'idle' && !analiseFeita && cnj && (
                <button
                  onClick={handleBuscarEscavador}
                  disabled={isPendingEscavador}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 px-5 py-2.5 text-sm font-bold text-slate-900 transition-all disabled:opacity-50"
                >
                  <Search className="h-4 w-4" /> Buscar documentos (CNJ: {cnj.substring(0,7)}...)
                </button>
              )}

              {/* Buscando processo por nome */}
              {(escavadorFase.fase === 'buscando_processo' || (isPendingEscavador && !cnj)) && (
                <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1f2937]" />
                  Varrendo bases do Escavador…
                </div>
              )}

              {/* Lista de processos sugeridos */}
              {escavadorFase.fase === 'escolher_processo' && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {escavadorFase.sugestoes.length} Resultados Encontrados
                  </p>
                  {escavadorFase.sugestoes.map((s) => (
                    <div key={s.cnj} className="flex items-start gap-4 rounded-none border border-slate-100 bg-slate-50 px-5 py-4 transition-all hover:border-slate-200">
                      <FileText className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-[#1f2937] font-mono tracking-tighter">{s.cnj}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-1 truncate">{s.orgao}</p>
                        {s.partes && <p className="text-[11px] text-slate-400 mt-1 italic truncate">{s.partes}</p>}
                      </div>
                      <button
                        onClick={() => handleSelecionarProcesso(s)}
                        className="flex items-center gap-1.5 flex-shrink-0 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-900 text-xs font-bold px-3.5 py-2 transition-all cursor-pointer"
                      >
                        Selecionar <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {escavadorFase.fase === 'nenhum_processo' && (
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-100 italic text-[13px] text-slate-400">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum processo encontrado com seu nome. Informe o CNJ manualmente.
                </div>
              )}

              {(escavadorFase.fase === 'buscando' || (isPendingEscavador && !!cnj)) && (
                <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1f2937]" />
                  Acessando diários oficiais…
                </div>
              )}

              {escavadorFase.fase === 'found' && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Publicações Disponíveis
                  </p>
                  {escavadorFase.docs.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-4 rounded-none border border-slate-100 bg-slate-50 px-5 py-4 transition-all hover:border-slate-200">
                      <FileText className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-[#1f2937] uppercase tracking-tight truncate leading-snug">{doc.nome}</p>
                        {doc.dataPublicacao && (
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-bold">
                            <Calendar className="h-3.5 w-3.5" />
                            {doc.dataPublicacao.split('-').reverse().join('/')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAnalisarDocEscavador(doc)}
                        className="flex items-center gap-1.5 flex-shrink-0 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-900 text-xs font-bold px-3.5 py-2 transition-all cursor-pointer"
                      >
                        Analisar <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Portal do tribunal (fallback manual) ───────────────────────── */}
            <div className="mt-8 flex flex-wrap gap-3">
              {tribunal && (
                <a
                  href={tribunal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setStep1Done(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  Acessar {tribunal.label}
                </a>
              )}
              {processoNumero && (
                <span className="inline-flex items-center gap-2 rounded-none bg-slate-50 border border-slate-100 px-4 py-3 text-[12px] font-mono font-bold text-slate-600">
                  {processoNumero}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Step 2: Documento para análise ──────────────────────────────── */}
        <div className={cn('px-8 py-6 flex gap-5', !step1Done && !analiseFeita ? 'opacity-30 pointer-events-none' : '')}>
          <StepDot done={analiseFeita} active={activeStep === 2} num={2} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Análise com Inteligência Artificial
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Suba o PDF da nomeação. Extraímos partes, vara e quesitos automaticamente.
            </p>

            {uploadState.fase === 'idle' && !analiseFeita && (
              <div className="mt-6">
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
                <div className="space-y-3">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 px-6 py-3 text-sm font-bold text-slate-900 transition-all cursor-pointer"
                  >
                    <Upload className="h-5 w-5" />
                    Fazer Upload do Documento
                  </button>
                  <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest px-1">PDF ou DOCX · Máx. 50 MB</p>
                </div>
              </div>
            )}

            {uploadState.fase === 'uploading' && (
              <div className="mt-6 flex items-center gap-3 text-[13px] font-bold text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-[#1f2937] flex-shrink-0" />
                {uploadState.progresso}
              </div>
            )}

            {uploadState.fase === 'erro' && (
              <div className="mt-6 flex items-start gap-4 rounded-none bg-red-50 border border-red-100 px-6 py-5">
                <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-black text-red-900 uppercase tracking-tight">{uploadState.mensagem}</p>
                  <button
                    onClick={() => { setUploadState({ fase: 'idle' }); if (fileRef.current) fileRef.current.value = '' }}
                    className="mt-2 text-[12px] font-bold text-red-600 hover:text-red-800 underline underline-offset-4 uppercase tracking-widest"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Resultado IA ─────────────────────────────────────────── */}
        <div className="px-8 py-6 flex gap-5">
          <StepDot done={analiseFeita} active={activeStep === 3} num={3} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Dados Extraídos
            </p>
            {!analiseFeita && uploadState.fase !== 'uploading' && (
              <p className="text-[14px] text-slate-300 mt-2 font-medium italic">
                Aguardando documento para iniciar processamento.
              </p>
            )}
            {analise && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AnaliseCard analise={analise} />
              </div>
            )}
          </div>
        </div>

      </div>
    </section>

  )
}
