/**
 * Gera o template "Proposta Padrão" no formato exato do PDF modelo:
 * timbrado simples → destinatário → processo → bloco italic → aceite →
 * REQUER → documentos réu → fechamento → assinatura
 *
 * Uso: node scripts/create-template-proposta-padrao.mjs [email-do-usuario]
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

const BLOB_TOKEN   = process.env.BLOB_READ_WRITE_TOKEN
const DATABASE_URL = process.env.DATABASE_URL

if (!BLOB_TOKEN || !DATABASE_URL) {
  console.error('Faltam BLOB_READ_WRITE_TOKEN ou DATABASE_URL no .env.local')
  process.exit(1)
}

// ─── Imports ─────────────────────────────────────────────────────────────────

const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx')
const { put } = await import('@vercel/blob')
const { PrismaClient } = await import('@prisma/client')

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FONT = 'Times New Roman'
const SZ_TITLE  = 28   // 14pt — nome do perito
const SZ_SUB    = 22   // 11pt — qualificação
const SZ_BODY   = 24   // 12pt — corpo
const SZ_SMALL  = 18   // 9pt  — email/rodapé

function p(alignment, spacing, ...runs) {
  return new Paragraph({ alignment, spacing, children: runs })
}

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SZ_BODY, ...opts })
}

function sp(before = 0, after = 240) {
  return new Paragraph({ spacing: { before, after }, children: [] })
}

// ─── Document ────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: 'Perilab',
  title: 'Template — Proposta Padrão de Honorários Periciais',
  styles: {
    default: { document: { run: { font: FONT, size: SZ_BODY } } },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 } },
    },
    children: [

      // ── Timbrado ─────────────────────────────────────────────────────────
      p(AlignmentType.CENTER, { after: 60 },
        new TextRun({ text: '{{peritoNome}}', font: FONT, size: SZ_TITLE, bold: true }),
      ),
      p(AlignmentType.CENTER, { after: 60 },
        new TextRun({ text: '{{peritoQual}}', font: FONT, size: SZ_SUB, italics: true }),
      ),
      p(AlignmentType.CENTER, { after: 480 },
        new TextRun({ text: '{{peritoEmail}}', font: FONT, size: SZ_SMALL, color: '64748B' }),
      ),

      // ── Destinatário ─────────────────────────────────────────────────────
      p(AlignmentType.CENTER, { after: 480 },
        new TextRun({ text: '{{destinatario}}', font: FONT, size: SZ_BODY, bold: true }),
      ),

      // ── Processo ─────────────────────────────────────────────────────────
      p(AlignmentType.LEFT, { after: 240 },
        new TextRun({ text: 'Processo Nº. {{numeroProcesso}}', font: FONT, size: SZ_BODY, bold: true }),
      ),

      // ── Bloco identificação (indentado à direita, itálico) ────────────────
      new Paragraph({
        indent: { left: 3600 },
        spacing: { after: 480 },
        children: [
          new TextRun({
            text: 'Referente a {{tipoPericia}}, movido por {{autor}}, contra {{reu}}',
            font: FONT, size: SZ_BODY, italics: true,
          }),
        ],
      }),

      // ── Parágrafo de aceite ───────────────────────────────────────────────
      p(AlignmentType.JUSTIFIED, { after: 480 },
        run('{{paragrafosAceite}}'),
      ),

      // ── REQUER ────────────────────────────────────────────────────────────
      p(AlignmentType.LEFT, { after: 120 },
        run('Desde já, REQUER que:', { bold: true }),
      ),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 480 },
        children: [run('{{requerimentosLista}}', { bold: true })],
      }),

      // ── Documentos do réu ─────────────────────────────────────────────────
      p(AlignmentType.LEFT, { after: 120 },
        run('Documentos a apresentar pelo réu:', { bold: true }),
      ),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 480 },
        children: [run('{{documentosReu}}')],
      }),

      // ── Fechamento ────────────────────────────────────────────────────────
      p(AlignmentType.RIGHT, { after: 60 },
        run('Termos em que'),
      ),
      p(AlignmentType.RIGHT, { after: 480 },
        run('Peço deferimento,'),
      ),
      p(AlignmentType.RIGHT, { after: 960 },
        run('{{cidade}}, {{dataFormatada}}'),
      ),

      // ── Assinatura ────────────────────────────────────────────────────────
      p(AlignmentType.CENTER, { after: 80 },
        run('_______________________________________________'),
      ),
      p(AlignmentType.CENTER, { after: 60 },
        new TextRun({ text: '{{peritoNome}}', font: FONT, size: SZ_BODY, bold: true }),
      ),
      p(AlignmentType.CENTER, { after: 60 },
        new TextRun({ text: '{{peritoQual}}', font: FONT, size: SZ_SUB, italics: true }),
      ),

      sp(600, 0),
      p(AlignmentType.CENTER, { after: 0 },
        new TextRun({ text: 'Gerado via Perilab', font: FONT, size: 16, color: 'CBD5E1', italics: true }),
      ),
    ],
  }],
})

// ─── Pack ─────────────────────────────────────────────────────────────────────

console.log('Gerando .docx…')
const buffer = await Packer.toBuffer(doc)
console.log(`Tamanho: ${buffer.length} bytes`)

// ─── Upload Vercel Blob ────────────────────────────────────────────────────────

console.log('Subindo para Vercel Blob…')
const blob = await put('templates/proposta-padrao.docx', buffer, {
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
  user = await prisma.user.findFirst({
    where: { role: 'perito' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true },
  })
}

if (!user) {
  console.error('Usuário não encontrado. Passe o email como argumento.')
  await prisma.$disconnect()
  process.exit(1)
}
console.log(`Usuário: ${user.name} (${user.email})`)

// ─── Criar / atualizar ProposalTemplate ───────────────────────────────────────

const TAGS = [
  '{{peritoNome}}', '{{peritoQual}}', '{{peritoEmail}}',
  '{{destinatario}}', '{{numeroProcesso}}',
  '{{tipoPericia}}', '{{autor}}', '{{reu}}',
  '{{paragrafosAceite}}', '{{requerimentosLista}}', '{{documentosReu}}',
  '{{cidade}}', '{{dataFormatada}}',
]

const existing = await prisma.proposalTemplate.findFirst({
  where: { userId: user.id, nome: 'Proposta Padrão' },
})

if (existing) {
  await prisma.proposalTemplate.update({
    where: { id: existing.id },
    data: { blobUrl: blob.url, nomeArquivo: 'proposta-padrao.docx', tamanhoBytes: buffer.length, tagsDetected: JSON.stringify(TAGS) },
  })
  console.log('Template atualizado:', existing.id)
} else {
  const tmpl = await prisma.proposalTemplate.create({
    data: {
      userId: user.id,
      nome: 'Proposta Padrão',
      descricao: 'Petição de honorários periciais — formato padrão RJ',
      blobUrl: blob.url,
      nomeArquivo: 'proposta-padrao.docx',
      tamanhoBytes: buffer.length,
      tagsDetected: JSON.stringify(TAGS),
      ativo: true,
    },
  })
  console.log('Template criado:', tmpl.id)
}

await prisma.$disconnect()
console.log('Concluído.')
