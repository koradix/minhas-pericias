import { describe, it, expect, beforeAll } from 'vitest'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import {
  detectTags,
  validateTags,
  fillTemplate,
  buildRenderData,
  REQUIRED_TAGS,
} from '../docx-engine'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal valid DOCX buffer with the given body text.
 * Uses docxtemplater itself to produce a well-formed ZIP/DOCX.
 */
function makeDocx(bodyText: string): Buffer {
  // We'll construct a minimal OOXML document manually
  const wordXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${bodyText}</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new PizZip()
  zip.file('word/document.xml', wordXml)
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`)
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)

  return zip.generate({ type: 'nodebuffer' }) as Buffer
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('docx-engine — detectTags', () => {
  it('returns empty tags for a template with no placeholders', async () => {
    const buf = makeDocx('Texto sem nenhum placeholder aqui.')
    const result = await detectTags(buf)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.tags).toEqual([])
  })

  it('detects all {{tag}} placeholders in the template', async () => {
    const buf = makeDocx('Olá {{peritoNome}}, processo {{numeroProcesso}}.')
    const result = await detectTags(buf)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toContain('{{peritoNome}}')
      expect(result.tags).toContain('{{numeroProcesso}}')
    }
  })

  it('returns CORRUPT_TEMPLATE error for a non-DOCX buffer', async () => {
    const buf = Buffer.from('this is not a docx file at all', 'utf8')
    const result = await detectTags(buf)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('CORRUPT_TEMPLATE')
  })
})

describe('docx-engine — validateTags', () => {
  it('ok=true when all required tags are present', () => {
    const detected = [...REQUIRED_TAGS]
    const r = validateTags(detected)
    expect(r.ok).toBe(true)
    expect(r.missing).toHaveLength(0)
  })

  it('ok=false and lists missing tags when some are absent', () => {
    const detected = ['{{peritoNome}}', '{{dataProposta}}'] // intentionally incomplete
    const r = validateTags(detected)
    expect(r.ok).toBe(false)
    expect(r.missing).toContain('{{numeroProcesso}}')
    expect(r.missing).toContain('{{descricaoServicos}}')
  })
})

describe('docx-engine — fillTemplate', () => {
  it('fills placeholders and returns a DOCX buffer on success', async () => {
    const buf = makeDocx('Perito: {{peritoNome}}, Processo: {{numeroProcesso}}')
    const result = await fillTemplate(buf, {
      peritoNome:      'Dr. João Silva',
      numeroProcesso:  '0001234-56.2024.8.26.0001',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
    }
  })

  it('returns CORRUPT_TEMPLATE for a corrupted/non-DOCX buffer', async () => {
    const buf = Buffer.from('not a docx', 'utf8')
    const result = await fillTemplate(buf, { peritoNome: 'Test' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('CORRUPT_TEMPLATE')
  })
})

describe('docx-engine — buildRenderData', () => {
  it('maps proposal fields to flat tag record', () => {
    const data = buildRenderData({
      numeroProcesso:    '0001234-56.2024.8.26.0001',
      tribunal:          'TJSP',
      vara:              '3ª Vara Cível',
      autor:             'João',
      reu:               'Maria',
      peritoNome:        'Dr. Silva',
      peritoQualificacao: 'Engenheiro Civil',
      descricaoServicos: 'Avaliação estrutural',
      valorHonorarios:   5000,
      custoDeslocamento: 500,
      dataProposta:      '01/01/2025',
    })

    expect(data.numeroProcesso).toBe('0001234-56.2024.8.26.0001')
    expect(data.peritoNome).toBe('Dr. Silva')
    expect(data.valorHonorarios).toContain('5.000')   // BRL formatted
    expect(data.totalHonorarios).toContain('5.500')   // 5000 + 500
    expect(data.dataProposta).toBe('01/01/2025')
  })
})

describe('docx-engine — multiple proposal versions', () => {
  it('each version produces an independent DOCX buffer', async () => {
    const buf = makeDocx('Honorários: {{valorHonorarios}}')

    const v1 = await fillTemplate(buf, { valorHonorarios: 'R$ 5.000,00' })
    const v2 = await fillTemplate(buf, { valorHonorarios: 'R$ 8.000,00' })

    expect(v1.ok).toBe(true)
    expect(v2.ok).toBe(true)
    if (v1.ok && v2.ok) {
      // Buffers are different (different rendered values)
      expect(v1.buffer.equals(v2.buffer)).toBe(false)
      // Both are valid DOCX — can be re-parsed without error
      expect(() => new PizZip(v1.buffer)).not.toThrow()
      expect(() => new PizZip(v2.buffer)).not.toThrow()
    }
  })
})
