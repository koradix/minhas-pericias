/**
 * laudo-docx.ts — Gera DOCX de laudo pericial a partir das seções editadas.
 * Usa a lib `docx` (já instalada) para criar o documento do zero,
 * seguindo formatação formal/jurídica elegante compatível com tribunais.
 *
 * Design System:
 *   Font:    Garamond (elegante serif, padrão em documentos jurídicos premium)
 *   Cores:   paleta quente sem azul — charcoal, taupe, âmbar
 *   Layout:  texto justificado, recuo de primeira linha, espaçamento 1.5
 */

import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  Packer,
} from 'docx'

// ─── Design Tokens ────────────────────────────────────────────────────────────

const FONT = 'Garamond'

const COLOR = {
  CHARCOAL:  '2D2D2D',
  ONYX:      '1A1A1A',
  WARM_GRAY: '7A7066',
  TAUPE:     'C4B9A8',
  AMBER:     '96723C',
  DARK_WARM: '5C5347',
} as const

const SIZE = {
  TITLE:   36,  // 18pt
  H2:      28,  // 14pt
  BODY:    24,  // 12pt
  SMALL:   22,  // 11pt
  CAPTION: 20,  // 10pt
  HEADER:  18,  //  9pt
  TINY:    16,  //  8pt
} as const

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

  // Fotos da vistoria
  fotos?: { url: string; descricao: string }[]

  // Documentos do processo referenciados
  documentosProcesso?: { nome: string; tipo: string | null }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elegantRule(): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
    },
    children: [],
  })
}

// ─── Build ────────────────────────────────────────────────────────────────────

export async function gerarLaudoDocx(input: LaudoDocxInput): Promise<Buffer> {
  const children: Paragraph[] = []

  // ── Capa / Título ──────────────────────────────────────────────────────
  children.push(
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: input.titulo.toUpperCase(),
          bold: true,
          size: SIZE.TITLE,
          font: FONT,
          color: COLOR.CHARCOAL,
        }),
      ],
    }),
    elegantRule(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'Template PeriLaB — Modelo Padrão',
          italics: true,
          size: SIZE.CAPTION,
          font: FONT,
          color: COLOR.WARM_GRAY,
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 } }),
  )

  // Dirigido ao juiz
  if (input.vara || input.comarca) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA',
            bold: true,
            size: SIZE.SMALL,
            font: FONT,
            color: COLOR.CHARCOAL,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `${input.vara ?? '[VARA]'} DA COMARCA DE ${input.comarca ?? '[COMARCA]'}`,
            size: SIZE.SMALL,
            font: FONT,
            color: COLOR.CHARCOAL,
          }),
        ],
      }),
    )
  }

  // Dados do processo — bloco compacto e elegante
  const processLines: { label: string; value: string }[] = []
  if (input.processo) processLines.push({ label: 'Processo', value: input.processo })
  if (input.autor) processLines.push({ label: 'Autor', value: input.autor })
  if (input.reu) processLines.push({ label: 'Ré', value: input.reu })

  for (const { label, value } of processLines) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: SIZE.SMALL, font: FONT, color: COLOR.CHARCOAL }),
        new TextRun({ text: value, size: SIZE.SMALL, font: FONT, color: COLOR.ONYX }),
      ],
    }))
  }

  children.push(
    new Paragraph({ spacing: { after: 200 } }),
    elegantRule(),
    new Paragraph({ spacing: { after: 400 } }),
  )

  // ── Seções ─────────────────────────────────────────────────────────────
  for (const secao of input.secoes) {
    // Título da seção
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 240 },
        children: [
          new TextRun({
            text: secao.titulo.toUpperCase(),
            bold: true,
            size: SIZE.H2,
            font: FONT,
            color: COLOR.CHARCOAL,
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
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
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: p.trim(),
              bold: true,
              size: SIZE.BODY,
              font: FONT,
              color: COLOR.CHARCOAL,
            }),
          ],
        }))
      } else {
        // Dividir por \n simples dentro do parágrafo
        const lines = p.split('\n')
        const runs: TextRun[] = []
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) runs.push(new TextRun({ text: '', break: 1 }))

          const line = lines[i]

          // Campos editáveis em âmbar quente (não azul)
          if (
            line.includes('[EDITAR PELO PERITO]') ||
            line.includes('[COMPLEMENTAR]') ||
            line.includes('[VALIDAR DADO]')
          ) {
            runs.push(new TextRun({
              text: line,
              size: SIZE.BODY,
              font: FONT,
              color: COLOR.AMBER,
              italics: true,
            }))
          } else {
            runs.push(new TextRun({
              text: line,
              size: SIZE.BODY,
              font: FONT,
              color: COLOR.ONYX,
            }))
          }
        }

        children.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
          indent: { firstLine: 720 },
          children: runs,
        }))
      }
    }
  }

  // ── Documentação do Processo ────────────────────────────────────────────
  if (input.documentosProcesso && input.documentosProcesso.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 240 },
        children: [
          new TextRun({
            text: 'DOCUMENTAÇÃO DO PROCESSO',
            bold: true,
            size: SIZE.H2,
            font: FONT,
            color: COLOR.CHARCOAL,
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
        },
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({
            text: 'Os seguintes documentos do processo foram utilizados como base para elaboração deste laudo:',
            size: SIZE.BODY,
            font: FONT,
            color: COLOR.ONYX,
          }),
        ],
      }),
    )

    for (let i = 0; i < input.documentosProcesso.length; i++) {
      const doc = input.documentosProcesso[i]
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          indent: { left: 720 },
          children: [
            new TextRun({ text: `Doc. ${i + 1} — `, bold: true, size: SIZE.BODY, font: FONT, color: COLOR.CHARCOAL }),
            new TextRun({ text: doc.nome, size: SIZE.BODY, font: FONT, color: COLOR.ONYX }),
            ...(doc.tipo ? [new TextRun({ text: ` (${doc.tipo.toUpperCase()})`, size: SIZE.CAPTION, font: FONT, color: COLOR.WARM_GRAY })] : []),
          ],
        }),
      )
    }
  }

  // ── Fotos da Vistoria ──────────────────────────────────────────────────
  if (input.fotos && input.fotos.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 240 },
        children: [
          new TextRun({
            text: 'REGISTRO FOTOGRÁFICO',
            bold: true,
            size: SIZE.H2,
            font: FONT,
            color: COLOR.CHARCOAL,
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
        },
      }),
    )

    for (let i = 0; i < input.fotos.length; i++) {
      const foto = input.fotos[i]
      try {
        const res = await fetch(foto.url)
        if (!res.ok) continue
        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        if (buffer.length === 0) continue

        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 280, after: 80 },
            children: [
              new TextRun({
                text: `Foto ${i + 1}`,
                bold: true,
                size: SIZE.CAPTION,
                font: FONT,
                color: COLOR.CHARCOAL,
              }),
              ...(foto.descricao ? [new TextRun({
                text: ` — ${foto.descricao}`,
                size: SIZE.CAPTION,
                font: FONT,
                color: COLOR.DARK_WARM,
                italics: true,
              })] : []),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new ImageRun({
                data: buffer,
                transformation: { width: 500, height: 375 },
                type: 'jpg',
              }),
            ],
          }),
        )
      } catch {
        // Skip foto que falhou o download
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Foto ${i + 1}: ${foto.descricao || '[sem descrição]'} — imagem indisponível`,
                italics: true,
                size: SIZE.CAPTION,
                font: FONT,
                color: COLOR.WARM_GRAY,
              }),
            ],
          }),
        )
      }
    }
  }

  // ── Montagem do Documento ─────────────────────────────────────────────

  const footerParts: string[] = []
  if (input.peritoTelefone) footerParts.push(`Tel: ${input.peritoTelefone}`)
  if (input.peritoEmail) footerParts.push(input.peritoEmail)
  if (input.peritoSite) footerParts.push(input.peritoSite)
  const footerText = footerParts.join('  ·  ')

  const doc = new Document({
    creator: input.peritoNome,
    title: input.titulo,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE.BODY, color: COLOR.ONYX },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1580, right: 1300 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: input.peritoNome.toUpperCase(),
                  bold: true,
                  size: SIZE.HEADER,
                  font: FONT,
                  color: COLOR.WARM_GRAY,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: input.peritoQualificacao,
                  size: SIZE.TINY,
                  font: FONT,
                  color: COLOR.WARM_GRAY,
                  italics: true,
                }),
              ],
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
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
                top: { style: BorderStyle.SINGLE, size: 1, color: COLOR.TAUPE },
              },
              spacing: { before: 80 },
              children: [
                ...(footerText ? [new TextRun({
                  text: `${footerText}  ·  `,
                  size: SIZE.TINY,
                  font: FONT,
                  color: COLOR.WARM_GRAY,
                })] : []),
                new TextRun({
                  text: 'Página ',
                  size: SIZE.TINY,
                  font: FONT,
                  color: COLOR.WARM_GRAY,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: SIZE.TINY,
                  font: FONT,
                  color: COLOR.WARM_GRAY,
                }),
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
