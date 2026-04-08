'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'
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

type UploadState =
  | { fase: 'idle' }
  | { fase: 'uploading'; progresso: string }
  | { fase: 'ok'; analise: AnaliseIA; nomeacaoId: string }
  | { fase: 'erro'; mensagem: string }

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ done, active }: { done: boolean; active: boolean; num: number }) {
  if (done) return (
    <div className="h-2 w-2 bg-[#a3e635] flex-shrink-0 mt-1.5" />
  )
  if (active) return (
    <div className="h-2 w-2 bg-slate-900 animate-pulse flex-shrink-0 mt-1.5" />
  )
  return (
    <div className="h-2 w-2 border border-slate-200 bg-white flex-shrink-0 mt-1.5" />
  )
}

// ─── Análise result card ───────────────────────────────────────────────────────

function AnaliseCard({ analise }: { analise: AnaliseIA }) {
  const tipo = analise.resumoProcesso?.tipoAcao ?? analise.nomeacaoDespacho?.determinacaoJuiz ?? null
  const partes = [analise.autor, analise.reu].filter(Boolean).join(' × ') || null
  const quesitosCount = analise.nomeacaoDespacho?.quesitos?.length ?? 0

  return (
    <div className="rounded-none border border-slate-200 bg-slate-50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">
          Análise concluída
        </p>
        {quesitosCount > 0 && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {quesitosCount} quesitos
          </span>
        )}
      </div>
      <div className="space-y-3">
        {tipo && <p className="text-[13px] text-slate-900 font-bold leading-relaxed uppercase tracking-tight">{tipo}</p>}
        {partes && <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{partes}</p>}
      </div>
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-900 bg-[#a3e635] inline-block rounded-none px-3 py-1.5 uppercase tracking-widest leading-none">
          Dados extraídos via IA
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
  const router = useRouter()

  const tribunal = TRIBUNAL_URLS[(tribunalSigla || 'DESCONHECIDO').toUpperCase()]
  const analise: AnaliseIA | null =
    uploadState.fase === 'ok' ? uploadState.analise : analiseInicial

  const analiseFeita = hasAnalise || uploadState.fase === 'ok'

  const activeStep: 1 | 2 | 3 = analiseFeita ? 3 : 2

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
        ? 'Limite atingido. Aguarde 1 minuto.'
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''
    setUploadState({ fase: 'uploading', progresso: 'Enviando...' })
    try {
      const blobUrl = await uploadFile(file, (pct) => setUploadState({ fase: 'uploading', progresso: `${pct}%` }))
      await sendToApi(blobUrl, file)
    } catch {
      setUploadState({ fase: 'erro', mensagem: 'Erro no upload' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        {/* Passo 1 — Obter nomeação */}
        <div className="flex gap-4">
          <StepDot done={analiseFeita} active={false} num={1} />
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">01. Nomeação</p>
            {tribunal && !analiseFeita && (
              <a href={tribunal.url} target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                Acessar {tribunal.label} →
              </a>
            )}
            {analiseFeita && (
              <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">Documento Extraído</p>
            )}
          </div>
        </div>

        {/* Passo 2 — Upload / Processamento */}
        <div className="flex gap-4">
          <StepDot done={analiseFeita} active={activeStep === 2} num={2} />
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">02. Inteligência IA</p>
            
            {!analiseFeita && uploadState.fase === 'idle' && (
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
                <button onClick={() => fileRef.current?.click()}
                  className="text-left text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:text-[#a3e635] transition-all">
                  [ + ] Carregar Nomeação
                </button>
              </div>
            )}
            {uploadState.fase === 'uploading' && (
               <p className="text-[9px] font-black text-[#a3e635] uppercase tracking-widest animate-pulse">
                Processando: {uploadState.progresso}
              </p>
            )}
            {uploadState.fase === 'erro' && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Falha: {uploadState.mensagem}</p>
                <button onClick={() => fileRef.current?.click()}
                  className="text-[9px] font-black text-slate-900 uppercase tracking-widest underline decoration-2 underline-offset-4">
                  Tentar Novamente
                </button>
              </div>
            )}
            {analiseFeita && (
              <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">Análise Concluída</p>
            )}
          </div>
        </div>

        {/* Passo 3 — Finalização */}
        <div className="flex gap-4">
          <StepDot done={analiseFeita} active={activeStep === 3} num={3} />
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">03. Laudo Editorial</p>
          </div>
        </div>
      </div>
    </div>
  )
}
