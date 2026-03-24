/**
 * Template Text Extractor
 *
 * Extracts plain text from uploaded template files so that:
 *   1. Templates can be indexed semantically (vector search)
 *   2. AI drafting actions can receive the template as context
 *   3. Token counts can be pre-calculated for prompt budgeting
 *
 * ── CURRENT STATE ─────────────────────────────────────────────────────────────
 * Returns null (stub). Text extraction is not yet implemented.
 *
 * ── FUTURE INTEGRATION ────────────────────────────────────────────────────────
 * To activate extraction:
 *
 *   PDF:
 *     npm install pdf-parse
 *     import pdfParse from 'pdf-parse'
 *     const data = await pdfParse(buffer)
 *     return data.text
 *
 *   DOCX:
 *     npm install mammoth
 *     import mammoth from 'mammoth'
 *     const result = await mammoth.extractRawText({ buffer })
 *     return result.value
 *
 *   TXT:
 *     return buffer.toString('utf-8')
 *
 * Once extraction is active, call updateTemplateExtraction() from this module
 * after a successful upload, or schedule it as a background job.
 */

import { prisma } from '@/lib/prisma'
import type { TemplateExtractionResult } from '@/lib/types/templates'

// ─── Token estimator ─────────────────────────────────────────────────────────

/**
 * Rough token count estimate.
 * ~4 characters per token on average (Claude / GPT tokenizers).
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

// ─── Main extraction function (stub) ─────────────────────────────────────────

/**
 * Attempt to extract plain text from a stored template file.
 *
 * @param storagePath  Public path to the file, e.g. /uploads/templates/xyz.pdf
 * @param mimeType     MIME type of the file
 * @returns            Extracted text, or null if extraction is not yet supported
 */
export async function extractTextFromTemplate(
  storagePath: string,
  mimeType: string | null,
): Promise<string | null> {
  // STUB — return null until extraction libraries are installed
  // Replace this body with the actual extraction logic described above
  void storagePath
  void mimeType
  return null
}

// ─── DB update helper ─────────────────────────────────────────────────────────

/**
 * Run extraction on a template and persist the result.
 * Safe to call on every upload — if extraction returns null, fields stay null.
 */
export async function processTemplateExtraction(
  templateId: string,
  storagePath: string,
  mimeType: string | null,
): Promise<TemplateExtractionResult> {
  try {
    const texto = await extractTextFromTemplate(storagePath, mimeType)

    await prisma.modeloBase.update({
      where: { id: templateId },
      data: {
        textoExtraido: texto,
        tokenCount: texto ? estimateTokenCount(texto) : null,
        processadoEm: new Date(),
      },
    })

    return {
      templateId,
      status: texto !== null ? 'done' : 'not_applicable',
      textoExtraido: texto,
      tokenCount: texto ? estimateTokenCount(texto) : null,
      processadoEm: new Date(),
    }
  } catch (err) {
    return {
      templateId,
      status: 'failed',
      textoExtraido: null,
      tokenCount: null,
      processadoEm: null,
      erro: err instanceof Error ? err.message : String(err),
    }
  }
}
