/**
 * laudo-docx.ts — Gera DOCX de laudo pericial a partir das seções editadas.
 * Usa a lib `docx` (já instalada) para criar o documento do zero,
 * seguindo formatação formal/jurídica compatível com tribunais.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  Packer,
} from 'docx'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LaudoDocxInput {
  // Cabeçalho
  peritoNome: string
  peritoQualificacao: string
  peritoTelefone?: string
  peritoEmail?: string
  peritoSite?: string
  peritoRegistro?: string

  // Processo
  titulo: string         // ex: "LAUDO PERICIAL — SANEAMENTO E ABASTECIMENTO DE ÁGUA"
  vara?: string
  comarca?: string
  processo?: string
  autor?: string
  reu?: string

  // Seções
  secoes: { titulo: string; conteudo: string }[]
}

// ─── Build ────────────────────────────────────────────────────────────────────

export async function gerarLaudoDocx(input: LaudoDocxInput): Promise<Buffer> {
  const children: Paragraph[] = []

  // ── Capa / Título ──────────────────────────────────────────────────────
  children.push(
    new Paragraph({ spacing: { after: 400 } }), // espaço
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: input.titulo.toUpperCase(), bold: true, size: 28, font: 'Arial' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Template PeriLaB — Modelo Padrão', italics: true, size: 20, font: 'Arial', color: '666666' }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 } }),
  )

  // Dirigido ao juiz
  if (input.vara || input.comarca) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA', bold: true, size: 22, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: `${input.vara ?? '[VARA]'} DA COMARCA DE ${input.comarca ?? '[COMARCA]'}`, size: 22, font: 'Arial' }),
        ],
      }),
    )
  }

  // Dados do processo
  if (input.processo) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Processo: ', bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: input.processo, size: 22, font: 'Arial' }),
      ],
    }))
  }
  if (input.autor) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Autor: ', bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: input.autor, size: 22, font: 'Arial' }),
      ],
    }))
  }
  if (input.reu) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Ré: ', bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: input.reu, size: 22, font: 'Arial' }),
      ],
    }))
  }

  children.push(new Paragraph({ spacing: { after: 400 } }))

  // ── Seções ─────────────────────────────────────────────────────────────
  for (const secao of input.secoes) {
    // Título da seção
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({ text: secao.titulo.toUpperCase(), bold: true, size: 24, font: 'Arial' }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
        },
      }),
    )

    // Conteúdo — dividir por \n\n para parágrafos
    const paragrafos = secao.conteudo.split(/\n\n+/)
    for (const p of paragrafos) {
      if (!p.trim()) continue

      // Subseções (ex: "5.1. DA LEGISLAÇÃO", "7.1. REPRESENTANTES")
      const isSubheading = /^\d+\.\d+\.?\s/.test(p.trim())

      if (isSubheading) {
        children.push(new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: p.trim(), bold: true, size: 22, font: 'Arial' }),
          ],
        }))
      } else {
        // Dividir por \n simples dentro do parágrafo
        const lines = p.split('\n')
        const runs: TextRun[] = []
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) runs.push(new TextRun({ text: '', break: 1 }))

          const line = lines[i]

          // Highlight [EDITAR PELO PERITO] e [COMPLEMENTAR]
          if (line.includes('[EDITAR PELO PERITO]') || line.includes('[COMPLEMENTAR]') || line.includes('[VALIDAR DADO]')) {
            runs.push(new TextRun({ text: line, size: 22, font: 'Arial', color: '0066CC', italics: true }))
          } else {
            runs.push(new TextRun({ text: line, size: 22, font: 'Arial' }))
          }
        }

        children.push(new Paragraph({
          spacing: { after: 120 },
          children: runs,
        }))
      }
    }
  }

  // ── Documento ──────────────────────────────────────────────────────────

  const headerText = `${input.peritoNome} • ${input.peritoQualificacao}`
  const footerParts: string[] = []
  if (input.peritoTelefone) footerParts.push(`Tel: ${input.peritoTelefone}`)
  if (input.peritoEmail) footerParts.push(`E-mail: ${input.peritoEmail}`)
  if (input.peritoSite) footerParts.push(input.peritoSite)
  const footerText = footerParts.join('  |  ')

  const doc = new Document({
    creator: input.peritoNome,
    title: input.titulo,
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [
                new TextRun({ text: input.peritoNome, bold: true, size: 20, font: 'Arial' }),
                new TextRun({ text: ` • ${input.peritoQualificacao}`, size: 18, font: 'Arial', color: '888888' }),
              ],
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
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
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
              children: [
                new TextRun({ text: footerText ? `${footerText}  |  ` : '', size: 16, font: 'Arial', color: '888888' }),
                new TextRun({ text: 'Pág. ', size: 16, font: 'Arial', color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: '888888' }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
