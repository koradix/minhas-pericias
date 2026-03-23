'use client'

import { useState } from 'react'
import { Printer, FileDown, Loader2 } from 'lucide-react'
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

// ── Serializable draft shape (no Date fields) ─────────────────────────────────

export interface PropostaExportData {
  pericoNumero:      string
  pericoAssunto:     string
  pericoProcesso:    string
  pericoVara:        string
  pericoPartes:      string
  dataProposta:      string
  peritoNome:        string
  peritoQualificacao:string
  descricaoServicos: string
  valorHonorarios:   number | null
  custoDeslocamento: number | null
  horasTecnicas:     number | null
  prazoEstimado:     string
  observacoes:       string
  complexidadeNota:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function formatBRL(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ── DOCX builder ─────────────────────────────────────────────────────────────

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

function buildDocx(d: PropostaExportData): Document {
  const totalHonorarios = (d.valorHonorarios ?? 0) + (d.custoDeslocamento ?? 0)

  // ── Fee table rows ─────────────────────────────────────────────────────────
  const feeRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: noBorder,
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, size: 18, font: 'Calibri' })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: noBorder,
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Valor', bold: true, size: 18, font: 'Calibri' })] })],
        }),
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
    feeRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Custo de deslocamento', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ borders: noBorder, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(d.custoDeslocamento), size: 20, font: 'Calibri' })] })] }),
        ],
      }),
    )
  }

  if (d.horasTecnicas != null) {
    feeRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Horas técnicas estimadas', size: 18, font: 'Calibri', color: '6B7280' })] })] }),
          new TableCell({ borders: noBorder, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${d.horasTecnicas}h`, size: 18, font: 'Calibri', color: '6B7280' })] })] }),
        ],
      }),
    )
  }

  // Total row
  if (d.valorHonorarios != null || d.custoDeslocamento != null) {
    feeRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: noBorder, shading: { fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 22, font: 'Calibri' })] })] }),
          new TableCell({ borders: noBorder, shading: { fill: 'F8FAFC' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(totalHonorarios), bold: true, size: 22, font: 'Calibri', color: '059669' })] })] }),
        ],
      }),
    )
  }

  // ── Document ──────────────────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [
    // Header
    new Paragraph({
      text: 'PROPOSTA DE HONORÁRIOS PERICIAIS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `${d.pericoNumero}  ·  ${formatDate(d.dataProposta)}`, size: 18, color: '94A3B8', font: 'Calibri' }),
      ],
    }),

    // I — Processo
    sectionTitle('I — Identificação do processo'),
    labelRow('Número do processo', d.pericoNumero),
    labelRow('Autos',              d.pericoProcesso),
    labelRow('Assunto',            d.pericoAssunto),
    labelRow('Vara / Tribunal',    d.pericoVara),
    labelRow('Parte / Autor',      d.pericoPartes),

    // II — Perito
    sectionTitle('II — Identificação do perito'),
    labelRow('Nome',         d.peritoNome),
    labelRow('Qualificação', d.peritoQualificacao),

    // III — Serviços
    sectionTitle('III — Descrição dos serviços periciais'),
    new Paragraph({
      text: d.descricaoServicos || '—',
      spacing: { after: 80 },
      style: 'Normal',
      children: [new TextRun({ text: d.descricaoServicos || '—', size: 20, font: 'Calibri' })],
    }),

    // IV — Honorários
    sectionTitle('IV — Honorários propostos'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: feeRows,
    }),
    blank(),

    // V — Prazo
    sectionTitle('V — Prazo estimado'),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: d.prazoEstimado || '—', size: 20, font: 'Calibri' })],
    }),
  ]

  // VI — Observações (conditional)
  if (d.observacoes) {
    children.push(
      sectionTitle('VI — Observações'),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: d.observacoes, size: 20, font: 'Calibri' })],
      }),
    )
  }

  // Complexidade (conditional)
  if (d.complexidadeNota) {
    children.push(
      sectionTitle('Nota de complexidade'),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: d.complexidadeNota, size: 20, font: 'Calibri' })],
      }),
    )
  }

  // Signature
  children.push(
    blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
      children: [new TextRun({ text: '_______________________________________________', size: 20, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: d.peritoNome || '___________________________', bold: true, size: 20, font: 'Calibri' })],
    }),
    ...(d.peritoQualificacao ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: d.peritoQualificacao, size: 18, color: '6B7280', font: 'Calibri' })],
    })] : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: formatDate(d.dataProposta), size: 18, color: '94A3B8', font: 'Calibri' })],
    }),
    blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Gerado via PeriLaB', size: 16, color: 'CBD5E1', font: 'Calibri', italics: true })],
    }),
  )

  return new Document({
    creator: 'PeriLaB',
    title: `Proposta de Honorários — ${d.pericoNumero}`,
    description: 'Proposta de honorários periciais',
    sections: [{ properties: {}, children }],
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PropostaExportBtnProps {
  draft: PropostaExportData
}

export function PropostaExportBtn({ draft }: PropostaExportBtnProps) {
  const [isDocxLoading, setIsDocxLoading] = useState(false)

  function handlePrint() {
    window.print()
  }

  async function handleDocx() {
    setIsDocxLoading(true)
    try {
      const doc  = buildDocx(draft)
      const blob = await Packer.toBlob(doc)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `proposta-honorarios-${draft.pericoNumero.replace(/[^a-zA-Z0-9-]/g, '-')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDocxLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted text-zinc-300 font-medium text-sm px-4 py-2.5 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </button>

      <button
        onClick={handleDocx}
        disabled={isDocxLoading}
        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 font-medium text-sm px-4 py-2.5 transition-colors"
      >
        {isDocxLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <FileDown className="h-4 w-4" />
        }
        Exportar DOCX
      </button>
    </div>
  )
}
