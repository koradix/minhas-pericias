'use client'

import { useState, useRef } from 'react'
import {
 Lock,
 Sparkles,
 Loader2,
 CheckCircle2,
 AlertCircle,
 FileDown,
 Upload,
 X,
 Trash2,
 RotateCcw,
 ChevronDown,
 ChevronUp,
 ClipboardList,
 Clock,
} from 'lucide-react'
import { uploadFile } from '@/lib/client/upload'
import { upsertFeeProposal } from '@/lib/actions/fee-proposal'
import { deleteProposalTemplate } from '@/lib/actions/proposal-template'
import type { FeeProposalRow, FeeProposalVersionRow, FeeProposalData } from '@/lib/actions/fee-proposal'
import type { ProposalTemplateRow } from '@/lib/actions/proposal-template'
import type { GerarPropostaInput, GerarPropostaOutput } from '@/app/api/pericias/proposta/gerar/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnaliseIA {
 numeroProcesso?: string | null
 autor?: string | null
 reu?: string | null
 vara?: string | null
 tribunal?: string | null
 enderecoVistoria?: string | null
 tipoPericia?: string | null
 resumoProcesso?: {
 tipoAcao?: string
 objetoPericia?: string
 areaTecnica?: string
 } | null
 nomeacaoDespacho?: {
 quesitos?: string[]
 pontoCriticos?: string[]
 determinacaoJuiz?: string
 prazoPerito?: string | null
 } | null
 aceiteHonorarios?: {
 complexidade?: string
 prazoAceite?: string | null
 estrategiaHonorarios?: string
 justificativasAumento?: string[]
 } | null
 prazos?: {
 prazoAceite?: string | null
 prazoLaudo?: string | null
 } | null
 localPericia?: {
 enderecoCompleto?: string | null
 cidadeEstado?: string | null
 necessitaDeslocamento?: boolean
 custosLogisticos?: string | null
 } | null
 necessidadesTecnicas?: {
 tipoVistoria?: string
 equipamentos?: string[]
 } | null
 riscos?: {
 tecnico?: string[]
 juridico?: string[]
 informacoesFaltando?: string[]
 } | null
}

export interface PropostaTabProps {
 periciaId: string
 pericia: {
 numero: string
 assunto: string
 processo: string | null
 vara: string | null
 partes: string | null
 tribunal: string
 }
 analise: AnaliseIA | null
 peritoNome: string
 peritoFormacao: string
 rascunho: FeeProposalRow | null
 versoes: FeeProposalVersionRow[]
 templates: ProposalTemplateRow[]
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputCls =
 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-600 placeholder-slate-300 transition-all'

const textareaCls =
 `${inputCls} resize-none`

const labelCls =
 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-1.5'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number | null | undefined): string {
 if (v == null) return '—'
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function today(): string {
 return new Date().toISOString().slice(0, 10)
}

// ─── Sub-component: Blocked state ────────────────────────────────────────────

function PropostaBloqueada() {
 return (
 <section className="rounded-xl border border-slate-200 bg-white">
 <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
 <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50">
 <Lock className="h-6 w-6 text-slate-300" />
 </div>
 <div>
 <p className="text-[15px] font-semibold text-slate-700">
 Análise do processo necessária
 </p>
 <p className="text-sm text-slate-400 mt-1">
 Faça o upload do PDF do processo na aba Resumo para que a IA extraia os dados necessários.
 </p>
 </div>
 </div>
 </section>
 )
}

// ─── Sub-component: Template selector ────────────────────────────────────────

function TemplateSelector({
 templates,
 selectedId,
 onSelect,
 onDelete,
 onUploadNew,
 isUploading,
 uploadProgress,
}: {
 templates: ProposalTemplateRow[]
 selectedId: string | null
 onSelect: (id: string | null) => void
 onDelete: (id: string) => void
 onUploadNew: (file: File, nome: string) => Promise<void>
 isUploading: boolean
 uploadProgress: string
}) {
 const fileRef = useRef<HTMLInputElement>(null)
 const [pendingFile, setPendingFile] = useState<File | null>(null)
 const [templateNome, setTemplateNome] = useState('')
 const [showNomeInput, setShowNomeInput] = useState(false)

 function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
 const f = e.target.files?.[0]
 if (!f) return
 if (fileRef.current) fileRef.current.value = ''
 setPendingFile(f)
 setTemplateNome(f.name.replace(/\.docx$/i, ''))
 setShowNomeInput(true)
 }

 async function handleConfirm() {
 if (!pendingFile || !templateNome.trim()) return
 await onUploadNew(pendingFile, templateNome.trim())
 setPendingFile(null)
 setTemplateNome('')
 setShowNomeInput(false)
 }

 return (
 <div className="space-y-3">
 {/* Padrão Perilab (sempre disponível) */}
 <label className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all hover:bg-slate-50
 border-slate-200 has-[:checked]:border-lime-600 has-[:checked]:bg-lime-50">
 <input
 type="radio"
 name="template"
 value=""
 checked={selectedId === null}
 onChange={() => onSelect(null)}
 className="accent-lime-600"
 />
 <div className="min-w-0">
 <p className="text-[14px] font-semibold text-slate-800">Template padrão Perilab</p>
 <p className="text-xs text-slate-400">DOCX gerado automaticamente, sem timbrado</p>
 </div>
 </label>

 {/* Existing templates */}
 {templates.map((t) => (
 <label key={t.id} className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all hover:bg-slate-50
 border-slate-200 has-[:checked]:border-lime-600 has-[:checked]:bg-lime-50">
 <input
 type="radio"
 name="template"
 value={t.id}
 checked={selectedId === t.id}
 onChange={() => onSelect(t.id)}
 className="accent-lime-600"
 />
 <div className="flex-1 min-w-0">
 <p className="text-[14px] font-semibold text-slate-800 truncate">{t.nome}</p>
 <p className="text-xs text-slate-400 truncate">{t.nomeArquivo}</p>
 {t.tagsDetected.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-1.5">
 {t.tagsDetected.slice(0, 4).map((tag) => (
 <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 font-mono">{tag}</span>
 ))}
 {t.tagsDetected.length > 4 && (
 <span className="text-[10px] text-slate-400">+{t.tagsDetected.length - 4}</span>
 )}
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={(e) => { e.preventDefault(); onDelete(t.id) }}
 className="p-1 text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0"
 >
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 </label>
 ))}

 {/* Upload new */}
 {!showNomeInput && (
 <button
 type="button"
 onClick={() => fileRef.current?.click()}
 disabled={isUploading}
 className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 hover:border-lime-700 hover:bg-lime-50 px-4 py-3 text-[13px] font-medium text-slate-500 hover:text-lime-700 transition-all disabled:opacity-50"
 >
 {isUploading
 ? <><Loader2 className="h-4 w-4 animate-spin" />{uploadProgress}</>
 : <><Upload className="h-4 w-4" />Subir meu modelo .docx</>
 }
 </button>
 )}

 {showNomeInput && (
 <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
 <p className="text-[13px] font-semibold text-slate-800 truncate">
 {pendingFile?.name}
 </p>
 <div>
 <label className={labelCls}>Nome do modelo</label>
 <input
 value={templateNome}
 onChange={(e) => setTemplateNome(e.target.value)}
 className={inputCls}
 placeholder="Ex: Modelo TJRJ Engenharia"
 autoFocus
 />
 </div>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={handleConfirm}
 disabled={!templateNome.trim() || isUploading}
 className="flex items-center gap-1.5 rounded-lg bg-lime-700 hover:bg-lime-500 hover:text-slate-900 px-3 py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-50"
 >
 {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
 Salvar template
 </button>
 <button
 type="button"
 onClick={() => { setPendingFile(null); setTemplateNome(''); setShowNomeInput(false) }}
 className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-white transition-all"
 >
 <X className="h-3.5 w-3.5" />
 Cancelar
 </button>
 </div>
 </div>
 )}

 <input
 ref={fileRef}
 type="file"
 accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
 className="hidden"
 onChange={handleFileChange}
 />
 </div>
 )
}

// ─── Sub-component: Version history ──────────────────────────────────────────

function VersionHistory({ versoes }: { versoes: FeeProposalVersionRow[] }) {
 const [open, setOpen] = useState(false)
 if (versoes.length === 0) return null

 return (
 <div className="rounded-xl border border-slate-200 bg-white">
 <button
 type="button"
 onClick={() => setOpen((v) => !v)}
 className="flex w-full items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
 >
 <div className="flex items-center gap-2.5">
 <Clock className="h-4 w-4 text-slate-400" />
 <p className="text-[14px] font-semibold text-slate-700 ">
 Histórico de versões
 <span className="ml-2 text-[12px] font-normal text-slate-400">({versoes.length})</span>
 </p>
 </div>
 {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
 </button>

 {open && (
 <div className="divide-y divide-slate-100 border-t border-slate-100">
 {versoes.map((v) => (
 <div key={v.id} className="px-6 py-4 flex items-center gap-3">
 <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-500 flex-shrink-0">
 v{v.versao}
 </span>
 <div className="flex-1 min-w-0">
 <p className="text-[13px] font-medium text-slate-700 ">
 Versão {v.versao} · {v.iaModel || 'editada manualmente'}
 </p>
 <p className="text-xs text-slate-400">
 {new Date(v.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 {v.snapshot.valorHonorarios != null && (
 <span className="text-[13px] font-semibold text-lime-700">
 {formatBRL(v.snapshot.valorHonorarios)}
 </span>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PropostaTab({
 periciaId,
 pericia,
 analise,
 peritoNome: peritoNomeDefault,
 peritoFormacao,
 rascunho,
 versoes: versoesProp,
 templates: templatesProp,
}: PropostaTabProps) {
 // ── State ──────────────────────────────────────────────────────────────────

 const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
 rascunho?.templateId ?? null,
 )
 const [templates, setTemplates] = useState<ProposalTemplateRow[]>(templatesProp)
 const [versoes, setVersoes] = useState<FeeProposalVersionRow[]>(versoesProp)

 const [peritoNome, setPeritoNome] = useState(rascunho?.peritoNome || peritoNomeDefault)
 const [peritoQual, setPeritoQual] = useState(rascunho?.peritoQualificacao || peritoFormacao)

 // Editable content (starts from rascunho or AI output)
 const [content, setContent] = useState<Partial<FeeProposalData>>({
 descricaoServicos: rascunho?.descricaoServicos ?? '',
 resumoTecnico: rascunho?.resumoTecnico ?? '',
 metodologia: rascunho?.metodologia ?? '',
 fasesEstimadas: rascunho?.fasesEstimadas ?? [],
 horasEstimadas: rascunho?.horasEstimadas ?? null,
 despesasPrevistas: rascunho?.despesasPrevistas ?? '',
 valorHonorarios: rascunho?.valorHonorarios ?? null,
 custoDeslocamento: rascunho?.custoDeslocamento ?? null,
 prazoEntrega: rascunho?.prazoEntrega ?? '',
 condicoesPagamento: rascunho?.condicoesPagamento ?? '',
 observacoes: rascunho?.observacoes ?? '',
 riscosEPendencias: rascunho?.riscosEPendencias ?? [],
 complexidade: rascunho?.complexidade ?? '',
 dataProposta: rascunho?.dataProposta || today(),
 })

 const [qaResult, setQaResult] = useState<GerarPropostaOutput['qa'] | null>(null)

 type Phase = 'template' | 'form' | 'result'
 const [phase, setPhase] = useState<Phase>(
 rascunho?.status === 'gerada' ? 'result' : 'template',
 )

 const [isGenerating, setIsGenerating] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [isDownloading, setIsDownloading] = useState(false)
 const [isUploading, setIsUploading] = useState(false)
 const [uploadProgress, setUploadProgress] = useState('')

 const [genError, setGenError] = useState<string | null>(null)
 const [saveError, setSaveError] = useState<string | null>(null)
 const [dlError, setDlError] = useState<string | null>(null)

 const [lastIaModel, setLastIaModel] = useState(rascunho?.iaModel ?? '')
 const [lastRawOutput, setLastRawOutput] = useState(rascunho?.iaRawOutput ?? '')

 // ── Derived ────────────────────────────────────────────────────────────────

 if (!analise) return <PropostaBloqueada />

 // Non-null assertion is safe: early return above guarantees analise is defined
 // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
 const a = analise!

 const processSnapshot = {
 numeroProcesso: pericia.processo ?? a.numeroProcesso ?? '',
 tribunal: a.tribunal ?? pericia.tribunal,
 vara: pericia.vara ?? a.vara ?? '',
 assunto: pericia.assunto,
 partes: pericia.partes ?? [a.autor, a.reu].filter(Boolean).join(' × ') ?? '',
 tipoPericia: a.tipoPericia ?? a.resumoProcesso?.tipoAcao ?? '',
 endereco: a.enderecoVistoria ?? a.localPericia?.enderecoCompleto ?? '',
 quesitos: a.nomeacaoDespacho?.quesitos ?? [],
 }

 // ── Template upload ────────────────────────────────────────────────────────

 async function handleTemplateUpload(file: File, nome: string) {
 setIsUploading(true)
 setUploadProgress('Enviando…')
 try {
 const blobUrl = await uploadFile(file, (pct) => setUploadProgress(`Enviando… ${pct}%`))
 setUploadProgress('Registrando template…')
 const res = await fetch('/api/pericias/proposta/template-upload', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 blobUrl,
 nomeArquivo: file.name,
 tamanhoBytes: file.size,
 nome,
 }),
 })
 const json = await res.json() as { ok: boolean; templateId?: string; tagsDetected?: string[]; error?: string }
 if (!json.ok) throw new Error(json.error ?? 'Erro ao salvar template')

 setTemplates((prev) => [
 ...prev,
 {
 id: json.templateId!,
 nome,
 descricao: null,
 nomeArquivo: file.name,
 tamanhoBytes: file.size,
 tagsDetected: json.tagsDetected ?? [],
 ativo: true,
 criadoEm: new Date().toISOString(),
 },
 ])
 setSelectedTemplateId(json.templateId!)
 } catch (err) {
 setSaveError(err instanceof Error ? err.message : 'Erro ao subir template')
 } finally {
 setIsUploading(false)
 setUploadProgress('')
 }
 }

 async function handleDeleteTemplate(id: string) {
 await deleteProposalTemplate(id)
 setTemplates((prev) => prev.filter((t) => t.id !== id))
 if (selectedTemplateId === id) setSelectedTemplateId(null)
 }

 // ── AI Generation ─────────────────────────────────────────────────────────

 async function handleGenerate() {
 setIsGenerating(true)
 setGenError(null)

 const input: GerarPropostaInput = {
 numeroProcesso: processSnapshot.numeroProcesso,
 tribunal: processSnapshot.tribunal,
 vara: processSnapshot.vara,
 comarca: a.localPericia?.cidadeEstado ?? null,
 tipoAcao: a.resumoProcesso?.tipoAcao ?? processSnapshot.assunto,
 objetoPericia: a.resumoProcesso?.objetoPericia ?? '',
 areaTecnica: a.resumoProcesso?.areaTecnica ?? '',
 quesitos: processSnapshot.quesitos,
 autor: a.autor ?? null,
 reu: a.reu ?? null,
 valorCausa: null,
 complexidade: a.aceiteHonorarios?.complexidade ?? '',
 estrategia: a.aceiteHonorarios?.estrategiaHonorarios ?? '',
 justificativas: a.aceiteHonorarios?.justificativasAumento ?? [],
 enderecoVistoria: a.enderecoVistoria ?? a.localPericia?.enderecoCompleto ?? null,
 necessitaDeslocamento: a.localPericia?.necessitaDeslocamento ?? false,
 custosLogisticos: a.localPericia?.custosLogisticos ?? null,
 prazoAceite: a.prazos?.prazoAceite ?? a.aceiteHonorarios?.prazoAceite ?? null,
 prazoLaudo: a.prazos?.prazoLaudo ?? null,
 tipoVistoria: a.necessidadesTecnicas?.tipoVistoria ?? '',
 equipamentos: a.necessidadesTecnicas?.equipamentos ?? [],
 riscosTecnicos: a.riscos?.tecnico ?? [],
 riscosJuridicos: a.riscos?.juridico ?? [],
 informacoesFaltando: a.riscos?.informacoesFaltando ?? [],
 peritoNome: peritoNome,
 peritoQualificacao: peritoQual,
 }

 try {
 const res = await fetch('/api/pericias/proposta/gerar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(input),
 })
 const json = await res.json() as {
 ok: boolean; error?: string
 iaModel?: string; iaRawOutput?: string
 } & GerarPropostaOutput

 if (!json.ok) {
 setGenError(json.error ?? 'Erro ao gerar proposta')
 return
 }

 // Map output to editable content
 const td = json.texto_documento
 const est = json.estimativa

 const totalHoras = est?.fases
 ?.reduce((sum, f) => sum + (f.horas_estimadas ?? 0), 0) ?? null

 const totalValor = est?.despesas
 ?.reduce((sum, d) => sum + ((d.quantidade ?? 1) * (d.valor_unitario_sugerido ?? 0)), 0) ?? null

 const despesasText = est?.despesas
 ?.map((d) => `${d.tipo}: ${d.descricao}`)
 .join('\n') ?? ''

 const fases = est?.fases?.map((f) => f.nome) ?? []
 const riscos = json.qa?.riscos ?? []

 setContent({
 descricaoServicos: td?.escopo ?? '',
 resumoTecnico: json.pericia?.resumo_tecnico ?? '',
 metodologia: td?.metodologia ?? json.metodologia?.texto_base ?? '',
 fasesEstimadas: fases,
 horasEstimadas: totalHoras || null,
 despesasPrevistas: despesasText,
 valorHonorarios: totalValor || null,
 custoDeslocamento: null,
 prazoEntrega: json.condicoes?.prazo_entrega_dias
 ? `${json.condicoes.prazo_entrega_dias} dias úteis`
 : '',
 condicoesPagamento: json.condicoes?.forma_pagamento ?? td?.condicoes ?? '',
 observacoes: ((json.condicoes?.observacoes ?? []).join('\n') || td?.fechamento) ?? '',
 riscosEPendencias: riscos,
 complexidade: json.pericia?.complexidade ?? a.aceiteHonorarios?.complexidade ?? '',
 dataProposta: today(),
 })

 setQaResult(json.qa ?? null)
 setLastIaModel(json.iaModel ?? '')
 setLastRawOutput(json.iaRawOutput ?? '')

 setPhase('form')
 } catch (err) {
 setGenError(err instanceof Error ? err.message : 'Erro de rede')
 } finally {
 setIsGenerating(false)
 }
 }

 // ── Save ───────────────────────────────────────────────────────────────────

 async function handleSave(status: FeeProposalData['status']) {
 setIsSaving(true)
 setSaveError(null)

 const data: FeeProposalData = {
 ...processSnapshot,
 peritoNome: peritoNome,
 peritoQualificacao: peritoQual,
 descricaoServicos: content.descricaoServicos ?? '',
 resumoTecnico: content.resumoTecnico ?? '',
 metodologia: content.metodologia ?? '',
 fasesEstimadas: content.fasesEstimadas ?? [],
 horasEstimadas: content.horasEstimadas ?? null,
 despesasPrevistas: content.despesasPrevistas ?? '',
 valorHonorarios: content.valorHonorarios ?? null,
 custoDeslocamento: content.custoDeslocamento ?? null,
 prazoEntrega: content.prazoEntrega ?? '',
 condicoesPagamento: content.condicoesPagamento ?? '',
 observacoes: content.observacoes ?? '',
 riscosEPendencias: content.riscosEPendencias ?? [],
 complexidade: content.complexidade ?? '',
 dataProposta: content.dataProposta ?? today(),
 templateId: selectedTemplateId,
 iaModel: lastIaModel,
 iaRawOutput: lastRawOutput,
 status,
 }

 const result = await upsertFeeProposal(periciaId, data)
 if (!result.ok) {
 setSaveError(result.error)
 setIsSaving(false)
 return
 }

 if (status === 'gerada') {
 // Add new version to local list
 setVersoes((prev) => [
 {
 id: `v${result.versao}`,
 versao: result.versao,
 iaModel: lastIaModel,
 criadoEm: new Date().toISOString(),
 snapshot: data,
 },
 ...prev,
 ])
 setPhase('result')
 }

 setIsSaving(false)
 }

 // ── Download ───────────────────────────────────────────────────────────────

 async function handleDownload() {
 setIsDownloading(true)
 setDlError(null)

 const tagData: Record<string, string> = {
 numeroProcesso: processSnapshot.numeroProcesso,
 tribunal: processSnapshot.tribunal,
 vara: processSnapshot.vara,
 assunto: processSnapshot.assunto,
 partes: processSnapshot.partes,
 tipoPericia: processSnapshot.tipoPericia,
 endereco: processSnapshot.endereco,
 quesitosLista: processSnapshot.quesitos.map((q, i) => `${i + 1}. ${q}`).join('\n'),
 peritoNome: peritoNome,
 peritoQual: peritoQual,
 descricaoServicos: content.descricaoServicos ?? '',
 resumoTecnico: content.resumoTecnico ?? '',
 metodologia: content.metodologia ?? '',
 horasEstimadas: String(content.horasEstimadas ?? ''),
 despesasPrevistas: content.despesasPrevistas ?? '',
 valorHonorarios: String(content.valorHonorarios ?? ''),
 custoDeslocamento: String(content.custoDeslocamento ?? ''),
 prazoEntrega: content.prazoEntrega ?? '',
 condicoesPagamento: content.condicoesPagamento ?? '',
 observacoes: content.observacoes ?? '',
 complexidade: content.complexidade ?? '',
 hoje: new Date().toLocaleDateString('pt-BR'),
 autor: a.autor ?? '',
 reu: a.reu ?? '',
 }

 // Template do cliente
 if (selectedTemplateId) {
 try {
 const res = await fetch('/api/pericias/proposta/fill-template', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ templateId: selectedTemplateId, data: tagData }),
 })
 if (!res.ok) {
 const err = await res.json() as { error?: string }
 throw new Error(err.error ?? 'Erro ao preencher template')
 }
 const blob = await res.blob()
 triggerDownload(blob, `proposta-${processSnapshot.numeroProcesso.replace(/[^a-zA-Z0-9]/g, '-')}.docx`)
 } catch (err) {
 setDlError(err instanceof Error ? err.message : 'Erro ao baixar')
 } finally {
 setIsDownloading(false)
 }
 return
 }

 // Template padrão Perilab (gerado no cliente com docx.js)
 try {
 const {
 Document, Packer, Paragraph, TextRun,
 HeadingLevel, AlignmentType, BorderStyle,
 } = await import('docx')

 function sec(title: string) {
 return new Paragraph({
 text: title,
 heading: HeadingLevel.HEADING_2,
 spacing: { before: 320, after: 120 },
 border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' } },
 })
 }

 function body(text: string) {
 return new Paragraph({
 spacing: { after: 120 },
 children: [new TextRun({ text: text || '—', size: 20, font: 'Calibri' })],
 })
 }

 function row(label: string, value: string) {
 return new Paragraph({
 spacing: { after: 80 },
 children: [
 new TextRun({ text: `${label}: `, bold: true, size: 20, font: 'Calibri' }),
 new TextRun({ text: value || '—', size: 20, font: 'Calibri' }),
 ],
 })
 }

 const fases = (content.fasesEstimadas ?? [])
 .map((f) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `• ${f}`, size: 20, font: 'Calibri' })] }))

 const riscos = (content.riscosEPendencias ?? [])
 .map((r) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `• ${r}`, size: 20, font: 'Calibri', color: 'B91C1C' })] }))

 const doc = new Document({
 creator: 'Perilab',
 title: `Proposta de Honorários — ${processSnapshot.numeroProcesso}`,
 sections: [{
 properties: {},
 children: [
 new Paragraph({
 text: 'PROPOSTA DE HONORÁRIOS PERICIAIS',
 heading: HeadingLevel.HEADING_1,
 alignment: AlignmentType.CENTER,
 spacing: { after: 80 },
 }),
 new Paragraph({
 alignment: AlignmentType.CENTER,
 spacing: { after: 400 },
 children: [new TextRun({ text: `${processSnapshot.numeroProcesso} · ${tagData.hoje}`, size: 18, color: '94A3B8', font: 'Calibri' })],
 }),

 sec('I — Processo'),
 row('Número', processSnapshot.numeroProcesso),
 row('Tribunal', processSnapshot.tribunal),
 row('Vara', processSnapshot.vara),
 row('Autor', a.autor ?? ''),
 row('Réu', a.reu ?? ''),

 sec('II — Perito'),
 row('Nome', peritoNome),
 row('Qualificação', peritoQual),

 sec('III — Objeto e Resumo Técnico'),
 body(content.resumoTecnico ?? ''),

 sec('IV — Escopo dos Serviços'),
 body(content.descricaoServicos ?? ''),

 sec('V — Metodologia'),
 body(content.metodologia ?? ''),

 ...(fases.length > 0 ? [sec('VI — Fases Estimadas'), ...fases] : []),

 sec('VII — Honorários e Despesas'),
 row('Honorários', tagData.valorHonorarios ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(tagData.valorHonorarios)) : '—'),
 row('Deslocamento', tagData.custoDeslocamento ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(tagData.custoDeslocamento)) : '—'),
 row('Horas estimadas', tagData.horasEstimadas ? `${tagData.horasEstimadas}h` : '—'),
 row('Prazo de entrega', content.prazoEntrega ?? ''),
 row('Forma de pagamento', content.condicoesPagamento ?? ''),

 ...(content.observacoes ? [sec('VIII — Observações'), body(content.observacoes)] : []),
 ...(riscos.length > 0 ? [sec('IX — Riscos e Pendências'), ...riscos] : []),

 new Paragraph({ spacing: { before: 600, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________________________', size: 20, font: 'Calibri' })] }),
 new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: peritoNome, bold: true, size: 20, font: 'Calibri' })] }),
 new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tagData.hoje, size: 18, color: '94A3B8', font: 'Calibri' })] }),
 new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: 'Gerado via Perilab', size: 16, color: 'CBD5E1', font: 'Calibri', italics: true })] }),
 ],
 }],
 })

 const blob = await Packer.toBlob(doc)
 triggerDownload(blob, `proposta-${processSnapshot.numeroProcesso.replace(/[^a-zA-Z0-9]/g, '-')}.docx`)
 } catch (err) {
 setDlError(err instanceof Error ? err.message : 'Erro ao gerar DOCX')
 } finally {
 setIsDownloading(false)
 }
 }

 function triggerDownload(blob: Blob, filename: string) {
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = filename
 a.click()
 URL.revokeObjectURL(url)
 }

 // ── Render ─────────────────────────────────────────────────────────────────

 return (
 <div className="space-y-5">

 {/* ── Phase: Template selection ──────────────────────────────────────── */}
 {phase === 'template' && (
 <>
 <section className="rounded-xl border border-slate-200 bg-white">
 <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
 <ClipboardList className="h-5 w-5 text-lime-700" />
 <h2 className="text-[15px] font-semibold text-slate-800">Modelo do documento</h2>
 </div>
 <div className="px-6 py-5">
 <p className="text-[13px] text-slate-500 mb-4 ">
 Selecione um modelo existente ou suba seu próprio .docx com timbrado.
 A IA vai preencher as tags <code className="bg-slate-100 rounded px-1 text-[12px]">{'{{'}</code><code className="bg-slate-100 rounded px-1 text-[12px]">{'}}'}</code> automaticamente.
 </p>
 <TemplateSelector
 templates={templates}
 selectedId={selectedTemplateId}
 onSelect={setSelectedTemplateId}
 onDelete={handleDeleteTemplate}
 onUploadNew={handleTemplateUpload}
 isUploading={isUploading}
 uploadProgress={uploadProgress}
 />
 </div>
 </section>

 {/* Perito */}
 <section className="rounded-xl border border-slate-200 bg-white">
 <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
 <h2 className="text-[15px] font-semibold text-slate-800">Dados do perito</h2>
 </div>
 <div className="px-6 py-5 grid gap-4 sm:grid-cols-2">
 <div>
 <label className={labelCls}>Nome</label>
 <input value={peritoNome} onChange={(e) => setPeritoNome(e.target.value)} className={inputCls} />
 </div>
 <div>
 <label className={labelCls}>Qualificação</label>
 <input value={peritoQual} onChange={(e) => setPeritoQual(e.target.value)} className={inputCls} placeholder="Ex: Engenheiro Civil, CREA 12345" />
 </div>
 </div>
 </section>

 {saveError && (
 <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
 <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
 <p className="text-[13px] text-rose-700 ">{saveError}</p>
 </div>
 )}

 <button
 onClick={handleGenerate}
 disabled={isGenerating}
 className="w-full flex items-center justify-center gap-2 rounded-lg bg-lime-700 hover:bg-lime-500 hover:text-slate-900 px-4 py-3 text-[15px] font-semibold text-white transition-all disabled:opacity-50"
 >
 {isGenerating
 ? <><Loader2 className="h-5 w-5 animate-spin" /> Gerando proposta com IA…</>
 : <><Sparkles className="h-5 w-5" /> Gerar proposta com IA</>
 }
 </button>

 {genError && (
 <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
 <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
 <p className="text-[13px] text-rose-700 ">{genError}</p>
 </div>
 )}
 </>
 )}

 {/* ── Phase: Form (review + edit) ────────────────────────────────────── */}
 {phase === 'form' && (
 <>
 {/* AI badge */}
 {lastIaModel && (
 <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
 <Sparkles className="h-4 w-4 text-slate-500 flex-shrink-0" />
 <p className="text-[13px] font-medium text-slate-700 ">
 Proposta pré-preenchida via {lastIaModel} — revise e ajuste antes de salvar
 </p>
 </div>
 )}

 {/* QA warnings */}
 {(qaResult?.campos_faltantes?.length ?? 0) > 0 && (
 <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 space-y-1">
 <div className="flex items-center gap-2">
 <AlertCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
 <p className="text-[13px] font-semibold text-slate-800">Informações ausentes no processo</p>
 </div>
 <div className="ml-6 space-y-1">
 {qaResult!.campos_faltantes.map((c, i) => (
 <p key={i} className="text-[12px] text-slate-500 ">• {c}</p>
 ))}
 </div>
 </div>
 )}

 <section className="rounded-xl border border-slate-200 bg-white">
 <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
 <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Conteúdo da proposta</p>
 </div>
 <div className="divide-y divide-slate-100">

 <div className="px-6 py-5">
 <label className={labelCls}>Resumo técnico</label>
 <textarea rows={3} className={textareaCls} value={content.resumoTecnico ?? ''} onChange={(e) => setContent((p) => ({ ...p, resumoTecnico: e.target.value }))} />
 </div>

 <div className="px-6 py-5">
 <label className={labelCls}>Escopo dos serviços</label>
 <textarea rows={5} className={textareaCls} value={content.descricaoServicos ?? ''} onChange={(e) => setContent((p) => ({ ...p, descricaoServicos: e.target.value }))} />
 </div>

 <div className="px-6 py-5">
 <label className={labelCls}>Metodologia</label>
 <textarea rows={4} className={textareaCls} value={content.metodologia ?? ''} onChange={(e) => setContent((p) => ({ ...p, metodologia: e.target.value }))} />
 </div>

 <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
 <div className="px-6 py-5">
 <label className={labelCls}>Valor dos honorários (R$)</label>
 <input type="number" min="0" step="100" className={inputCls}
 value={content.valorHonorarios ?? ''}
 onChange={(e) => setContent((p) => ({ ...p, valorHonorarios: e.target.value ? parseFloat(e.target.value) : null }))}
 placeholder="Ex: 8000" />
 </div>
 <div className="px-6 py-5">
 <label className={labelCls}>Deslocamento (R$)</label>
 <input type="number" min="0" step="50" className={inputCls}
 value={content.custoDeslocamento ?? ''}
 onChange={(e) => setContent((p) => ({ ...p, custoDeslocamento: e.target.value ? parseFloat(e.target.value) : null }))}
 placeholder="0" />
 </div>
 <div className="px-6 py-5">
 <label className={labelCls}>Prazo de entrega</label>
 <input className={inputCls} value={content.prazoEntrega ?? ''} onChange={(e) => setContent((p) => ({ ...p, prazoEntrega: e.target.value }))} placeholder="Ex: 30 dias úteis" />
 </div>
 <div className="px-6 py-5">
 <label className={labelCls}>Horas estimadas</label>
 <input type="number" min="0" step="0.5" className={inputCls}
 value={content.horasEstimadas ?? ''}
 onChange={(e) => setContent((p) => ({ ...p, horasEstimadas: e.target.value ? parseFloat(e.target.value) : null }))} />
 </div>
 </div>

 <div className="px-6 py-5">
 <label className={labelCls}>Condições de pagamento</label>
 <input className={inputCls} value={content.condicoesPagamento ?? ''} onChange={(e) => setContent((p) => ({ ...p, condicoesPagamento: e.target.value }))} placeholder="Ex: 50% na aceitação, 50% na entrega" />
 </div>

 <div className="px-6 py-5">
 <label className={labelCls}>Observações e ressalvas</label>
 <textarea rows={3} className={textareaCls} value={content.observacoes ?? ''} onChange={(e) => setContent((p) => ({ ...p, observacoes: e.target.value }))} />
 </div>

 </div>
 </section>

 {saveError && (
 <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
 <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
 <p className="text-[13px] text-rose-700 ">{saveError}</p>
 </div>
 )}

 <div className="flex flex-wrap gap-3">
 <button
 onClick={() => void handleSave('rascunho')}
 disabled={isSaving}
 className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-[14px] font-medium text-slate-500 transition-all disabled:opacity-50"
 >
 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
 Salvar rascunho
 </button>
 <button
 onClick={() => void handleSave('gerada')}
 disabled={isSaving || !content.descricaoServicos}
 className="flex items-center gap-2 rounded-lg bg-lime-700 hover:bg-lime-500 hover:text-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-50"
 >
 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
 Confirmar e gerar proposta
 </button>
 </div>
 </>
 )}

 {/* ── Phase: Result ─────────────────────────────────────────────────── */}
 {phase === 'result' && (
 <>
 <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 flex items-center gap-3 shadow-sm">
 <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
 <ClipboardList className="h-5 w-5 text-slate-800 flex-shrink-0" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[15px] font-semibold text-slate-800">Proposta gerada</p>
 {content.valorHonorarios != null && (
 <p className="text-[13px] text-slate-500 ">
 {formatBRL(content.valorHonorarios)}
 {content.custoDeslocamento ? ` + ${formatBRL(content.custoDeslocamento)} deslocamento` : ''}
 </p>
 )}
 </div>
 </div>

 {dlError && (
 <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
 <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
 <p className="text-[13px] text-rose-700 ">{dlError}</p>
 </div>
 )}

 <div className="flex flex-wrap gap-3">
 <button
 onClick={handleDownload}
 disabled={isDownloading}
 className="flex items-center gap-2 rounded-lg bg-lime-700 hover:bg-lime-500 hover:text-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-50"
 >
 {isDownloading
 ? <><Loader2 className="h-4 w-4 animate-spin" />Gerando…</>
 : <><FileDown className="h-4 w-4" />Baixar .docx</>
 }
 </button>
 <button
 onClick={() => setPhase('form')}
 className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-[14px] font-medium text-slate-500 transition-all"
 >
 <RotateCcw className="h-4 w-4" />
 Editar proposta
 </button>
 <button
 onClick={() => { setPhase('template'); setContent({}); setGenError(null) }}
 className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-[14px] font-medium text-slate-500 transition-all"
 >
 <Sparkles className="h-4 w-4" />
 Gerar nova versão
 </button>
 </div>

 {/* Summary card */}
 <section className="rounded-xl border border-slate-200 bg-white">
 <div className="divide-y divide-slate-100">
 {content.resumoTecnico && (
 <div className="px-6 py-5">
 <p className={labelCls}>Resumo técnico</p>
 <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line ">{content.resumoTecnico}</p>
 </div>
 )}
 {content.descricaoServicos && (
 <div className="px-6 py-5">
 <p className={labelCls}>Escopo dos serviços</p>
 <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line ">{content.descricaoServicos}</p>
 </div>
 )}
 {(content.valorHonorarios != null || content.prazoEntrega) && (
 <div className="grid sm:grid-cols-3 px-6 py-5 gap-4">
 {content.valorHonorarios != null && (
 <div>
 <p className={labelCls}>Honorários</p>
 <p className="text-[15px] font-bold text-lime-700">{formatBRL(content.valorHonorarios)}</p>
 </div>
 )}
 {content.custoDeslocamento != null && (
 <div>
 <p className={labelCls}>Deslocamento</p>
 <p className="text-[15px] font-semibold text-slate-700">{formatBRL(content.custoDeslocamento)}</p>
 </div>
 )}
 {content.prazoEntrega && (
 <div>
 <p className={labelCls}>Prazo</p>
 <p className="text-[14px] font-semibold text-slate-700">{content.prazoEntrega}</p>
 </div>
 )}
 </div>
 )}
 {(content.riscosEPendencias?.length ?? 0) > 0 && (
 <div className="px-6 py-5 border-t border-slate-100">
 <p className={labelCls}>Riscos e pendências</p>
 <ul className="space-y-1.5 mt-2 border-l-2 border-slate-200 pl-3">
 {content.riscosEPendencias!.map((r, i) => (
 <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700 ">
 <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
 {r}
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 </section>

 <VersionHistory versoes={versoes} />
 </>
 )}

 </div>
 )
}
