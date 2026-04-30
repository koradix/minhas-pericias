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
      const marginX = 25
      const maxW = pageW - marginX * 2
      let y = 30

      // Title — elegant serif
      doc.setFont('times', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(45, 45, 45)
      const titleLines = doc.splitTextToSize(titulo, maxW) as string[]
      doc.text(titleLines, pageW / 2, y, { align: 'center' })
      y += titleLines.length * 7 + 4

      // Elegant thin separator
      doc.setDrawColor(196, 185, 168)
      doc.setLineWidth(0.3)
      doc.line(marginX + 20, y, pageW - marginX - 20, y)
      y += 10

      // Content — clean serif body
      doc.setFont('times', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(26, 26, 26)
      const lines = doc.splitTextToSize(conteudo, maxW) as string[]

      for (const line of lines) {
        if (y > 275) {
          // Page footer
          doc.setFont('times', 'italic')
          doc.setFontSize(8)
          doc.setTextColor(122, 112, 102)
          doc.text(`Página ${doc.getNumberOfPages()}`, pageW / 2, 288, { align: 'center' })

          doc.addPage()
          y = 25
          doc.setFont('times', 'normal')
          doc.setFontSize(11)
          doc.setTextColor(26, 26, 26)
        }
        doc.text(line, marginX, y)
        y += 5
      }

      // Final page footer
      doc.setFont('times', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(122, 112, 102)
      doc.text(`Página ${doc.getNumberOfPages()}`, pageW / 2, 288, { align: 'center' })

      doc.save(`${titulo}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleDOCX() {
    setDocxLoading(true)
    try {
      const {
        Document, Packer, Paragraph, TextRun, AlignmentType,
        Header, Footer, PageNumber, BorderStyle,
      } = await import('docx')

      const FONT = 'Garamond'
      const CHARCOAL = '2D2D2D'
      const ONYX = '1A1A1A'
      const WARM_GRAY = '7A7066'
      const TAUPE = 'C4B9A8'

      const titlePara = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({
          text: titulo,
          bold: true,
          size: 36,
          font: FONT,
          color: CHARCOAL,
        })],
      })

      const separatorPara = new Paragraph({
        spacing: { after: 300 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: TAUPE },
        },
        children: [],
      })

      const contentParas = conteudo.split('\n').map(
        (line) =>
          new Paragraph({
            alignment: line.trim() ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
            children: [
              new TextRun({
                text: line || ' ',
                size: 24,
                font: FONT,
                color: ONYX,
              }),
            ],
            spacing: { after: 80, line: 360 },
            ...(line.trim() && !line.startsWith(' ') && line.length > 40
              ? { indent: { firstLine: 720 } }
              : {}),
          }),
      )

      const document = new Document({
        styles: {
          default: {
            document: {
              run: { font: FONT, size: 24, color: ONYX },
              paragraph: { spacing: { line: 360 } },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, bottom: 1440, left: 1580, right: 1300 },
              },
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 },
                    children: [
                      new TextRun({
                        text: 'Perilab',
                        bold: true,
                        size: 18,
                        font: FONT,
                        color: WARM_GRAY,
                      }),
                    ],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: TAUPE },
                    },
                  }),
                ],
              }),
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    border: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: TAUPE },
                    },
                    spacing: { before: 80 },
                    children: [
                      new TextRun({ text: 'Página ', size: 16, font: FONT, color: WARM_GRAY }),
                      new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT, color: WARM_GRAY }),
                    ],
                  }),
                ],
              }),
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
