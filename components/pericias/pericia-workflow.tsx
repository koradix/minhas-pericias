'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'
import {
  ExternalLink,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Circle,
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
}

type UploadState =
  | { fase: 'idle' }
  | { fase: 'uploading'; progresso: string }
  | { fase: 'ok'; analise: AnaliseIA; nomeacaoId: string }
  | { fase: 'erro'; mensagem: string }

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ done, active, num }: { done: boolean; active: boolean; num: number }) {
  if (done) return <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
  if (active) return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-lime-500 bg-lime-50 text-xs font-bold text-lime-700 flex-shrink-0">
      {num}
    </span>
  )
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-bold text-slate-300 flex-shrink-0">
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
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-800">
          Análise concluída
          {quesitosCount > 0 && (
            <span className="ml-2 font-normal text-emerald-700 text-xs">
              · {quesitosCount} quesito{quesitosCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
      {tipo && <p className="text-xs text-slate-700 pl-6">{tipo}</p>}
      {partes && <p className="text-xs text-slate-500 pl-6">{partes}</p>}
      <p className="text-[11px] text-emerald-700 pl-6 font-medium">
        Use o botão "Usar dados da IA" abaixo para preencher os campos da perícia.
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
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ fase: 'idle' })
  const [step1Done, setStep1Done] = useState(false)
  const router = useRouter()

  const tribunal = TRIBUNAL_URLS[tribunalSigla.toUpperCase()]
  const analise: AnaliseIA | null =
    uploadState.fase === 'ok' ? uploadState.analise : analiseInicial

  const analiseFeita = hasAnalise || uploadState.fase === 'ok'

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadState({ fase: 'uploading', progresso: 'Enviando arquivo…' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tribunal', tribunalSigla)
    if (processoNumero) formData.append('numero', processoNumero)
    formData.append('periciaId', periciaId)

    try {
      setUploadState({ fase: 'uploading', progresso: 'Analisando com IA…' })
      const res = await fetch('/api/nomeacoes/upload', { method: 'POST', body: formData })
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

      // Salva automaticamente os dados extraídos na perícia e recarrega o servidor
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
    } catch (err) {
      setUploadState({ fase: 'erro', mensagem: 'Erro de conexão. Tente novamente.' })
    }
  }

  const steps = [
    { num: 1, done: step1Done || analiseFeita },
    { num: 2, done: analiseFeita },
    { num: 3, done: analiseFeita },
  ]

  const activeStep = steps.find((s) => !s.done)?.num ?? 3

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-50">
          <Circle className="h-3.5 w-3.5 text-lime-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">Próximos passos</h2>
        {analiseFeita && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-50">

        {/* ── Step 1: Acessar tribunal ─────────────────────────────────────── */}
        <div className={cn('px-5 py-4 flex gap-4', step1Done || analiseFeita ? 'opacity-60' : '')}>
          <StepDot done={step1Done || analiseFeita} active={activeStep === 1} num={1} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              Baixe o processo no portal do tribunal
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Acesse o portal, localize o processo pelo número e baixe o PDF da nomeação.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tribunal ? (
                <a
                  href={tribunal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setStep1Done(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {tribunal.label}
                </a>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Acesse o portal do {tribunalSigla} e procure pelo número {processoNumero ?? 'do processo'}.
                </p>
              )}
              {processoNumero && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2 py-1.5 text-xs font-mono text-blue-700">
                  {processoNumero}
                </span>
              )}
            </div>
            {!step1Done && !analiseFeita && (
              <button
                onClick={() => setStep1Done(true)}
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 underline underline-offset-2"
              >
                Já baixei o documento
              </button>
            )}
          </div>
        </div>

        {/* ── Step 2: Upload do documento ──────────────────────────────────── */}
        <div className={cn('px-5 py-4 flex gap-4', !step1Done && !analiseFeita ? 'opacity-50 pointer-events-none' : '')}>
          <StepDot done={analiseFeita} active={activeStep === 2} num={2} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              Suba o documento para análise da IA
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Envie o PDF do processo. A IA extrai partes, vara, quesitos e complexidade automaticamente.
            </p>

            {uploadState.fase === 'idle' && !analiseFeita && (
              <div className="mt-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Selecionar PDF ou DOCX
                </button>
                <p className="mt-1.5 text-[11px] text-slate-400">Máx. 50 MB · PDF ou DOCX</p>
              </div>
            )}

            {uploadState.fase === 'uploading' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-lime-500 flex-shrink-0" />
                {uploadState.progresso}
              </div>
            )}

            {uploadState.fase === 'erro' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-rose-700">{uploadState.mensagem}</p>
                  <button
                    onClick={() => { setUploadState({ fase: 'idle' }); if (fileRef.current) fileRef.current.value = '' }}
                    className="mt-1 text-[11px] text-rose-500 hover:text-rose-700 underline underline-offset-2"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Resultado IA ─────────────────────────────────────────── */}
        <div className="px-5 py-4 flex gap-4">
          <StepDot done={analiseFeita} active={activeStep === 3} num={3} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              Resultado da análise
            </p>
            {!analiseFeita && uploadState.fase !== 'uploading' && (
              <p className="text-xs text-slate-400 mt-0.5">
                Aguardando documento para análise.
              </p>
            )}
            {uploadState.fase === 'uploading' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400 flex-shrink-0" />
                Processando…
              </div>
            )}
            {analise && (
              <div className="mt-3">
                <AnaliseCard analise={analise} />
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
