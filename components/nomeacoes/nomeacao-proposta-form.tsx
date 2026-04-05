'use client'

import { useState, useRef } from 'react'
import {
  Sparkles,
  Loader2,
  FileDown,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx'
import type { GerarPropostaInput } from '@/app/api/nomeacoes/gerar-proposta/route'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProcessoData {
  nomeacaoId:     string
  numeroProcesso: string
  tribunal:       string
  vara:           string
  assunto:        string
  autor:          string
  tipoPericia:    string
  quesitos:       string[]
  endereco:       string
}

interface Props {
  processo:          ProcessoData
  peritoNomeDefault: string
  peritoQualDefault: string
}

interface PropostaData {
  descricaoServicos: string
  valorHonorarios:   number | null
  custoDeslocamento: number | null
  prazoEstimado:     string
  observacoes:       string
  complexidadeNota:  string
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500/40 disabled:opacity-50'

const textareaCls =
  'w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500/40 disabled:opacity-50'

const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5'

// ── DOCX builder ──────────────────────────────────────────────────────────────

const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const

function blank() {
  return new Paragraph({ text: '', spacing: { after: 120 } })
}

function sectionTitle(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' } },
  })
}

function labelRow(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}:  `, bold: true, size: 20, font: 'Calibri' }),
      new TextRun({ text: value || '—', size: 20, font: 'Calibri' }),
    ],
  })
}

function formatBRL(v: number | null): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function buildDocx(p: ProcessoData, d: PropostaData, peritoNome: string, peritoQual: string): Document {
  const hoje = new Date().toLocaleDateString('pt-BR')
  const total = (d.valorHonorarios ?? 0) + (d.custoDeslocamento ?? 0)

  const feeRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: noBorder, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, size: 18, font: 'Calibri' })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: noBorder, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Valor', bold: true, size: 18, font: 'Calibri' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Honorários periciais', size: 20, font: 'Calibri' })] })] }),
        new TableCell({ borders: noBorder, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(d.valorHonorarios), size: 20, font: 'Calibri' })] })] }),
      ],
    }),
  ]

  if (d.custoDeslocamento != null) {
    feeRows.push(new TableRow({
      children: [
        new TableCell({ borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Custo de deslocamento', size: 20, font: 'Calibri' })] })] }),
        new TableCell({ borders: noBorder, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(d.custoDeslocamento), size: 20, font: 'Calibri' })] })] }),
      ],
    }))
  }

  if (d.valorHonorarios != null || d.custoDeslocamento != null) {
    feeRows.push(new TableRow({
      children: [
        new TableCell({ borders: noBorder, shading: { fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 22, font: 'Calibri' })] })] }),
        new TableCell({ borders: noBorder, shading: { fill: 'F8FAFC' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(total), bold: true, size: 22, font: 'Calibri', color: '059669' })] })] }),
      ],
    }))
  }

  const serviceParas = (d.descricaoServicos || '—').split('\n\n').map((par) =>
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: par, size: 20, font: 'Calibri' })] })
  )

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: 'PROPOSTA DE HONORÁRIOS PERICIAIS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `${p.numeroProcesso}  ·  ${hoje}`, size: 18, color: '94A3B8', font: 'Calibri' })],
    }),

    sectionTitle('I — Identificação do processo'),
    labelRow('Número do processo', p.numeroProcesso),
    labelRow('Tribunal', p.tribunal),
    labelRow('Vara / Órgão', p.vara),
    labelRow('Assunto', p.assunto),
    labelRow('Tipo de Perícia', p.tipoPericia),
    labelRow('Parte / Autor', p.autor),
    labelRow('Endereço para vistoria', p.endereco),

    sectionTitle('II — Identificação do perito'),
    labelRow('Nome', peritoNome),
    labelRow('Qualificação', peritoQual),

    sectionTitle('III — Descrição dos serviços periciais'),
    ...serviceParas,

    sectionTitle('IV — Honorários propostos'),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: feeRows }),
    blank(),

    sectionTitle('V — Prazo estimado'),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: d.prazoEstimado || '—', size: 20, font: 'Calibri' })] }),
  ]

  if (d.observacoes) {
    children.push(
      sectionTitle('VI — Observações'),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: d.observacoes, size: 20, font: 'Calibri' })] }),
    )
  }

  if (d.complexidadeNota) {
    children.push(
      sectionTitle('Complexidade'),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: d.complexidadeNota, size: 20, font: 'Calibri' })] }),
    )
  }

  children.push(
    blank(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 80 }, children: [new TextRun({ text: '_______________________________________________', size: 20, font: 'Calibri' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: peritoNome || '___________________________', bold: true, size: 20, font: 'Calibri' })] }),
    ...(peritoQual ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: peritoQual, size: 18, color: '6B7280', font: 'Calibri' })] })] : []),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: hoje, size: 18, color: '94A3B8', font: 'Calibri' })] }),
    blank(),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Gerado via Perilab', size: 16, color: 'CBD5E1', font: 'Calibri', italics: true })] }),
  )

  return new Document({
    creator: 'Perilab',
    title: `Proposta de Honorários — ${p.numeroProcesso}`,
    sections: [{ properties: {}, children }],
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NomeacaoPropostaForm({ processo, peritoNomeDefault, peritoQualDefault }: Props) {
  const [peritoNome, setPeritoNome] = useState(peritoNomeDefault)
  const [peritoQual, setPeritoQual] = useState(peritoQualDefault)

  const [proposta, setProposta] = useState<PropostaData>({
    descricaoServicos: '',
    valorHonorarios:   null,
    custoDeslocamento: null,
    prazoEstimado:     '',
    observacoes:       '',
    complexidadeNota:  '',
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError]         = useState<string | null>(null)
  const [generated, setGenerated]       = useState(false)

  const [templateFile, setTemplateFile]   = useState<File | null>(null)
  const [isFilling, setIsFilling]         = useState(false)
  const [fillError, setFillError]         = useState<string | null>(null)
  const [isExporting, setIsExporting]     = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── AI generation ──────────────────────────────────────────────────────────

  async function handleGenerate() {
    setIsGenerating(true)
    setGenError(null)
    try {
      const body: GerarPropostaInput = {
        numeroProcesso: processo.numeroProcesso,
        tribunal:       processo.tribunal,
        vara:           processo.vara,
        assunto:        processo.assunto,
        autor:          processo.autor,
        tipoPericia:    processo.tipoPericia,
        quesitos:       processo.quesitos,
        endereco:       processo.endereco,
        peritoNome,
        peritoQual,
      }
      const res = await fetch('/api/nomeacoes/gerar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json() as { ok: boolean; error?: string } & Partial<PropostaData>
      if (!json.ok) {
        setGenError(json.error ?? 'Erro na geração')
        return
      }
      setProposta({
        descricaoServicos: json.descricaoServicos ?? '',
        valorHonorarios:   json.valorHonorarios   ?? null,
        custoDeslocamento: json.custoDeslocamento  ?? null,
        prazoEstimado:     json.prazoEstimado      ?? '',
        observacoes:       json.observacoes        ?? '',
        complexidadeNota:  json.complexidadeNota   ?? '',
      })
      setGenerated(true)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Template DOCX fill ─────────────────────────────────────────────────────

  async function handleTemplateFill() {
    if (!templateFile) return
    setIsFilling(true)
    setFillError(null)
    try {
      const formData = new FormData()
      formData.append('template', templateFile)
      formData.append('data', JSON.stringify({
        numeroProcesso:    processo.numeroProcesso,
        tribunal:          processo.tribunal,
        vara:              processo.vara,
        assunto:           processo.assunto,
        autor:             processo.autor,
        tipoPericia:       processo.tipoPericia,
        endereco:          processo.endereco,
        peritoNome,
        peritoQual,
        descricaoServicos: proposta.descricaoServicos,
        valorHonorarios:   proposta.valorHonorarios,
        custoDeslocamento: proposta.custoDeslocamento,
        prazoEstimado:     proposta.prazoEstimado,
        observacoes:       proposta.observacoes,
        hoje:              new Date().toLocaleDateString('pt-BR'),
      }))
      const res = await fetch('/api/nomeacoes/fill-template', { method: 'POST', body: formData })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        setFillError(json.error ?? 'Erro ao preencher modelo')
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `proposta-${processo.numeroProcesso.replace(/[^a-zA-Z0-9]/g, '-')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setFillError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setIsFilling(false)
    }
  }

  // ── Export generated DOCX ──────────────────────────────────────────────────

  async function handleExport() {
    setIsExporting(true)
    try {
      const doc  = buildDocx(processo, proposta, peritoNome, peritoQual)
      const blob = await Packer.toBlob(doc)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `proposta-${processo.numeroProcesso.replace(/[^a-zA-Z0-9]/g, '-')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Perito ─────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Identificação do perito</p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nome</label>
            <input value={peritoNome} onChange={(e) => setPeritoNome(e.target.value)} className={inputCls} placeholder="Nome completo" />
          </div>
          <div>
            <label className={labelCls}>Qualificação</label>
            <input value={peritoQual} onChange={(e) => setPeritoQual(e.target.value)} className={inputCls} placeholder="Ex: Engenheiro Civil, CREA 12345" />
          </div>
        </div>
      </section>

      {/* ── AI Generation ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-violet-200 bg-violet-50 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-violet-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Gerar com IA</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600">
            A IA analisa os dados do processo (tipo de perícia, quesitos, endereço) e gera uma proposta completa — descrição dos serviços, valor estimado, prazo e observações.
          </p>
          {genError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              <p className="text-xs text-rose-700">{genError}</p>
            </div>
          )}
          {generated && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700">Proposta gerada — revise e ajuste os campos abaixo</p>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Gerando…' : 'Gerar proposta com IA'}
          </button>
        </div>
      </section>

      {/* ── Proposta Fields ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conteúdo da proposta</p>
        </div>
        <div className="p-5 space-y-4">

          <div>
            <label className={labelCls}>Descrição dos serviços</label>
            <textarea
              rows={6}
              value={proposta.descricaoServicos}
              onChange={(e) => setProposta({ ...proposta, descricaoServicos: e.target.value })}
              className={textareaCls}
              placeholder="Descreva os serviços periciais, metodologia, escopo e diligências previstas…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Honorários (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={proposta.valorHonorarios ?? ''}
                onChange={(e) => setProposta({ ...proposta, valorHonorarios: e.target.value ? parseFloat(e.target.value) : null })}
                className={inputCls}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Custo de deslocamento (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={proposta.custoDeslocamento ?? ''}
                onChange={(e) => setProposta({ ...proposta, custoDeslocamento: e.target.value ? parseFloat(e.target.value) : null })}
                className={inputCls}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Prazo estimado</label>
              <input
                value={proposta.prazoEstimado}
                onChange={(e) => setProposta({ ...proposta, prazoEstimado: e.target.value })}
                className={inputCls}
                placeholder="Ex: 30 dias úteis"
              />
            </div>
            <div>
              <label className={labelCls}>Complexidade</label>
              <input
                value={proposta.complexidadeNota}
                onChange={(e) => setProposta({ ...proposta, complexidadeNota: e.target.value })}
                className={inputCls}
                placeholder="Ex: Alta — multi-réu"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              rows={3}
              value={proposta.observacoes}
              onChange={(e) => setProposta({ ...proposta, observacoes: e.target.value })}
              className={textareaCls}
              placeholder="Condições, ressalvas, forma de pagamento…"
            />
          </div>

        </div>
      </section>

      {/* ── Export ─────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exportar DOCX</p>
        </div>
        <div className="p-5 space-y-4">

          {/* Option A — generate from template */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Opção A — Usar meu modelo DOCX</p>
            <p className="text-xs text-slate-500">
              Faça upload do seu modelo .docx com marcadores como{' '}
              <code className="bg-slate-100 rounded px-1">{'{{numeroProcesso}}'}</code>,{' '}
              <code className="bg-slate-100 rounded px-1">{'{{peritoNome}}'}</code>,{' '}
              <code className="bg-slate-100 rounded px-1">{'{{descricaoServicos}}'}</code>, etc.
              O sistema preenche automaticamente e devolve o arquivo editável.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {templateFile ? templateFile.name : 'Selecionar modelo (.docx)'}
              </button>
              {templateFile && (
                <button type="button" onClick={() => setTemplateFile(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                setTemplateFile(e.target.files?.[0] ?? null)
                setFillError(null)
              }}
            />

            {fillError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                <p className="text-xs text-rose-700">{fillError}</p>
              </div>
            )}

            <button
              onClick={handleTemplateFill}
              disabled={!templateFile || isFilling}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
            >
              {isFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isFilling ? 'Preenchendo…' : 'Preencher e baixar modelo'}
            </button>
          </div>

          {/* Option B — build from scratch */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Opção B — Gerar DOCX padrão Perilab</p>
            <p className="text-xs text-slate-500">Exporta um DOCX formatado com os dados preenchidos acima.</p>
            <button
              onClick={handleExport}
              disabled={isExporting || !proposta.descricaoServicos}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 font-semibold text-sm px-4 py-2.5 transition-colors"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isExporting ? 'Exportando…' : 'Exportar DOCX Perilab'}
            </button>
          </div>

        </div>
      </section>

    </div>
  )
}
