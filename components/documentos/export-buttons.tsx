'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  titulo: string
  conteudo: string
}

export function ExportButtons({ titulo, conteudo }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [docxLoading, setDocxLoading] = useState(false)

  async function handlePDF() {
    setPdfLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const marginX = 20
      const maxW = pageW - marginX * 2
      let y = 20

      // Title
      doc.setFont('courier', 'bold')
      doc.setFontSize(13)
      const titleLines = doc.splitTextToSize(titulo, maxW) as string[]
      doc.text(titleLines, marginX, y)
      y += titleLines.length * 6 + 6

      // Separator
      doc.setDrawColor(200, 200, 200)
      doc.line(marginX, y, pageW - marginX, y)
      y += 6

      // Content
      doc.setFont('courier', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(conteudo, maxW) as string[]

      for (const line of lines) {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(line, marginX, y)
        y += 4.5
      }

      doc.save(`${titulo}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleDOCX() {
    setDocxLoading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx')

      const titlePara = new Paragraph({
        children: [new TextRun({ text: titulo, bold: true, size: 28, font: 'Courier New' })],
        spacing: { after: 400 },
      })

      const separatorPara = new Paragraph({
        children: [new TextRun({ text: '─'.repeat(66), size: 18, font: 'Courier New' })],
        spacing: { after: 200 },
      })

      const contentParas = conteudo.split('\n').map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({ text: line || ' ', size: 18, font: 'Courier New' }),
            ],
            spacing: { after: 0, line: 276 },
          }),
      )

      const document = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
              },
            },
            children: [titlePara, separatorPara, ...contentParas],
          },
        ],
      })

      const blob = await Packer.toBlob(document)
      const url = URL.createObjectURL(blob)
      const a = globalThis.document.createElement('a')
      a.href = url
      a.download = `${titulo}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDocxLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePDF} disabled={pdfLoading}>
        {pdfLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        Exportar PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleDOCX} disabled={docxLoading}>
        {docxLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Exportar DOCX
      </Button>
    </div>
  )
}
