'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'

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

function StepDot({ done, active, num }: { done: boolean; active: boolean; num: number }) {
  if (done) return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a3e635] text-[11px] font-bold text-slate-900 flex-shrink-0">
      OK
    </span>
  )
  if (active) return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white flex-shrink-0">
      {num}
    </span>
  )
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-300 flex-shrink-0">
      {num}
    </span>
  )
}

// ─── Análise result card ───────────────────────────────────────────────────────

function AnaliseCard({ analise }: { analise: AnaliseIA }) {
  const tipo = analise.resumoProcesso?.tipoAcao ?? analise.nomeacaoDespacho?.determinacaoJuiz ?? null
  const partes = [analise.autor, analise.reu].filter(Boolean).join(' × ') || null
  const quesitosCount = analise.nomeacaoDespacho?.quesitos?.length ?? 0

  return (
    <div className="rounded-xl border border-[#a3e635]/30 bg-slate-50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
          Análise concluída
        </p>
        {quesitosCount > 0 && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {quesitosCount} quesito{quesitosCount > 1 ? 's' : ''} identificado{quesitosCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {tipo && <p className="text-sm text-slate-600 font-medium leading-relaxed">{tipo}</p>}
        {partes && <p className="text-xs text-slate-400 font-medium italic">{partes}</p>}
      </div>
      <div className="pt-2">
        <p className="text-[10px] font-bold text-slate-900 bg-[#a3e635] inline-block rounded-md px-3 py-1 uppercase tracking-widest">
          Dados extraídos
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">FLUXO DE TRABALHO</h2>
        {analiseFeita && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 bg-[#a3e635] rounded-md px-3 py-1.5">
            CONCLUÍDO
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {/* Passo 1 — Obter nomeação (informativo, sem bloqueio) */}
        <div className="px-8 py-10 flex gap-8">
          <StepDot done={analiseFeita} active={false} num={1} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">Obter Nomeação</p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">
              Acesse o portal do tribunal para obter o documento da nomeação.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              {tribunal && (
                <a href={tribunal.url} target="_blank" rel="noreferrer"
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 hover:text-slate-900 transition-colors">
                  Acessar {tribunal.label}
                </a>
              )}
              {processoNumero && (
                <span className="text-[11px] font-bold text-slate-300 font-mono tracking-tighter">
                  {processoNumero}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Passo 2 — Upload do documento */}
        <div className="px-8 py-10 flex gap-8">
          <StepDot done={analiseFeita} active={activeStep === 2} num={2} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">Processamento IA</p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">
              Extraímos dados estruturados, quesitos e partes automaticamente.
            </p>

            <div className="mt-8">
              {!analiseFeita && uploadState.fase === 'idle' && (
                <>
                  <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
                  <button onClick={() => fileRef.current?.click()}
                    className="bg-[#a3e635] text-slate-900 px-6 py-3 text-[12px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all">
                    Upload PDF / DOCX
                  </button>
                </>
              )}
              {uploadState.fase === 'uploading' && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  {uploadState.progresso}
                </p>
              )}
              {uploadState.fase === 'erro' && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
                    {uploadState.mensagem}
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
                  <button onClick={() => fileRef.current?.click()}
                    className="bg-slate-900 text-white px-6 py-3 text-[12px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passo 3 — Resultado */}
        <div className="px-8 py-10 flex gap-8">
          <StepDot done={analiseFeita} active={activeStep === 3} num={3} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">Resultado da Análise</p>
            {analise ? (
              <div className="mt-8">
                <AnaliseCard analise={analise} />
              </div>
            ) : (
              <p className="text-xs text-slate-300 mt-4 italic font-medium">Aguardando upload...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
