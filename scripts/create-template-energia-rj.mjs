/**
 * Gera o template "Honorário Energia RJ" no formato de petição judicial
 * com tags {{variavel}} para docxtemplater, sobe para Vercel Blob e registra no banco.
 *
 * Uso: node scripts/create-template-energia-rj.mjs [email-do-usuario]
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// ─── Env vars ────────────────────────────────────────────────────────────────

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
const env = readFileSync(envPath, 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}

const BLOB_TOKEN    = process.env.BLOB_READ_WRITE_TOKEN
const DATABASE_URL  = process.env.DATABASE_URL

if (!BLOB_TOKEN || !DATABASE_URL) {
  console.error('Faltam BLOB_READ_WRITE_TOKEN ou DATABASE_URL no .env.local')
  process.exit(1)
}

// ─── Imports ─────────────────────────────────────────────────────────────────

const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, UnderlineType, Table, TableRow, TableCell, WidthType, BorderWidth } = await import('docx')
const { put } = await import('@vercel/blob')
const { PrismaClient } = await import('@prisma/client')

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FONT = 'Times New Roman'
const SIZE_HEADER   = 28   // 14pt
const SIZE_SUBHEAD  = 22   // 11pt
const SIZE_BODY     = 24   // 12pt
const SIZE_SMALL    = 18   // 9pt

function centered(...runs) {
  return new Paragraph({ alignment: AlignmentType.CENTER, children: runs })
}

function justified(...runs) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: runs })
}

function right(...runs) {
  return new Paragraph({ alignment: AlignmentType.RIGHT, children: runs })
}

function spacer(before = 0, after = 200) {
  return new Paragraph({ spacing: { before, after }, children: [] })
}

function txt(text, opts = {}) {
  return new TextRun({ text, font: FONT, ...opts })
}

function bold(text, size = SIZE_BODY) {
  return txt(text, { bold: true, size })
}

function line(size = SIZE_BODY, ...opts) {
  return txt('', { size, ...opts })
}

function hrParagraph() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8', space: 4 } },
    spacing: { after: 240 },
    children: [],
  })
}

// ─── Document ────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: 'Perilab',
  title: 'Template — Honorário Energia RJ',
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SIZE_BODY },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 } },
    },
    children: [

      // ── Timbrado ─────────────────────────────────────────────────────────
      centered(bold('{{peritoNome}}', SIZE_HEADER)),
      centered(txt('{{peritoQual}}', { size: SIZE_SUBHEAD, italics: true })),
      centered(txt('{{peritoRegistro}}', { size: SIZE_SUBHEAD })),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          txt('{{peritoTelefone}}', { size: SIZE_SMALL, color: '64748B' }),
          txt('  |  ', { size: SIZE_SMALL, color: '94A3B8' }),
          txt('{{peritoEmail}}', { size: SIZE_SMALL, color: '64748B' }),
        ],
      }),
      hrParagraph(),

      // ── Destinatário ─────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [bold('{{destinatario}}', SIZE_BODY)],
      }),
      spacer(0, 400),

      // ── Processo ─────────────────────────────────────────────────────────
      justified(bold('Processo Nº. {{numeroProcesso}}', SIZE_BODY)),
      spacer(0, 400),

      // ── Bloco identificação (indentado à direita) ─────────────────────────
      new Paragraph({
        indent: { left: 3600 },
        spacing: { after: 60 },
        children: [
          txt('Pelo presente Instrumento, referente a ', { size: SIZE_BODY }),
          bold('{{tipoPericia}}', SIZE_BODY),
          txt(', movido por ', { size: SIZE_BODY }),
          bold('{{autor}}', SIZE_BODY),
          txt(', contra ', { size: SIZE_BODY }),
          bold('{{reu}}', SIZE_BODY),
          txt(', cujo imóvel está situado na ', { size: SIZE_BODY }),
          txt('{{endereco}}', { size: SIZE_BODY }),
        ],
      }),
      spacer(0, 400),

      // ── Parágrafo de aceite ───────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
        children: [txt('{{paragrafosAceite}}', { size: SIZE_BODY })],
      }),

      // ── Honorários destaque ───────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
        children: [
          txt('O valor proposto a título de honorários periciais é de ', { size: SIZE_BODY }),
          bold('{{valorHonorarios}}', SIZE_BODY),
          txt('.', { size: SIZE_BODY }),
        ],
      }),

      // ── REQUER ────────────────────────────────────────────────────────────
      justified(bold('Desde já, REQUER que:', SIZE_BODY)),
      spacer(0, 120),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 400 },
        children: [txt('{{requerimentosLista}}', { size: SIZE_BODY })],
      }),

      // ── Documentos do réu ─────────────────────────────────────────────────
      justified(bold('Documentos a serem apresentados pelo réu:', SIZE_BODY)),
      spacer(0, 120),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 400 },
        children: [txt('{{documentosReu}}', { size: SIZE_BODY })],
      }),

      // ── Escopo técnico ────────────────────────────────────────────────────
      spacer(0, 200),

      // ── Fechamento ────────────────────────────────────────────────────────
      right(txt('Termos em que', { size: SIZE_BODY })),
      right(txt('Peço deferimento,', { size: SIZE_BODY })),
      spacer(0, 400),
      right(txt('{{cidade}}, {{dataFormatada}}', { size: SIZE_BODY })),
      spacer(0, 900),

      // ── Assinatura ────────────────────────────────────────────────────────
      centered(txt('_______________________________________________', { size: SIZE_BODY })),
      spacer(0, 80),
      centered(bold('{{peritoNome}}', SIZE_BODY)),
      centered(txt('{{peritoQual}}', { size: SIZE_SUBHEAD, italics: true })),
      centered(txt('{{peritoRegistro}}', { size: SIZE_SUBHEAD })),
      centered(txt('{{peritoEmail}}', { size: SIZE_SMALL, color: '64748B' })),

      spacer(600, 0),
      centered(txt('Gerado via Perilab', { size: 16, color: 'CBD5E1', italics: true })),
    ],
  }],
})

// ─── Pack ─────────────────────────────────────────────────────────────────────

console.log('Gerando .docx...')
const buffer = await Packer.toBuffer(doc)
console.log(`Tamanho: ${buffer.length} bytes`)

// ─── Upload Vercel Blob ────────────────────────────────────────────────────────

console.log('Subindo para Vercel Blob...')
const blob = await put('templates/honorario-energia-rj.docx', buffer, {
  access: 'private',
  token: BLOB_TOKEN,
  allowOverwrite: true,
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
})
console.log('Blob URL:', blob.url)

// ─── Encontrar usuário ────────────────────────────────────────────────────────

const userEmail = process.argv[2] ?? null
let user

if (userEmail) {
  user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true, email: true, name: true } })
} else {
  // Pegar primeiro usuário com role perito
  user = await prisma.user.findFirst({
    where: { role: 'perito' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true },
  })
}

if (!user) {
  console.error('Usuário não encontrado. Passe o email como argumento: node ... email@dominio.com')
  await prisma.$disconnect()
  process.exit(1)
}
console.log(`Usuário: ${user.name} (${user.email})`)

// ─── Criar registro ProposalTemplate ──────────────────────────────────────────

const existing = await prisma.proposalTemplate.findFirst({
  where: { userId: user.id, nome: 'Honorário Energia RJ' },
})

if (existing) {
  await prisma.proposalTemplate.update({
    where: { id: existing.id },
    data: {
      blobUrl: blob.url,
      nomeArquivo: 'honorario-energia-rj.docx',
      tamanhoBytes: buffer.length,
      tagsDetected: JSON.stringify([
        '{{peritoNome}}','{{peritoQual}}','{{peritoRegistro}}','{{peritoTelefone}}','{{peritoEmail}}',
        '{{destinatario}}','{{numeroProcesso}}','{{tipoPericia}}','{{autor}}','{{reu}}','{{endereco}}',
        '{{paragrafosAceite}}','{{valorHonorarios}}','{{requerimentosLista}}','{{documentosReu}}',
        '{{cidade}}','{{dataFormatada}}',
      ]),
    },
  })
  console.log('Template atualizado:', existing.id)
} else {
  const tmpl = await prisma.proposalTemplate.create({
    data: {
      userId: user.id,
      nome: 'Honorário Energia RJ',
      descricao: 'Petição de honorários periciais — Engenharia Elétrica — TJRJ (Súmula 360)',
      blobUrl: blob.url,
      nomeArquivo: 'honorario-energia-rj.docx',
      tamanhoBytes: buffer.length,
      tagsDetected: JSON.stringify([
        '{{peritoNome}}','{{peritoQual}}','{{peritoRegistro}}','{{peritoTelefone}}','{{peritoEmail}}',
        '{{destinatario}}','{{numeroProcesso}}','{{tipoPericia}}','{{autor}}','{{reu}}','{{endereco}}',
        '{{paragrafosAceite}}','{{valorHonorarios}}','{{requerimentosLista}}','{{documentosReu}}',
        '{{cidade}}','{{dataFormatada}}',
      ]),
      ativo: true,
    },
  })
  console.log('Template criado:', tmpl.id)
}

await prisma.$disconnect()
console.log('Concluído.')
