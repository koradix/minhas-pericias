/**
 * Template Storage Service
 *
 * Abstraction layer for persisting uploaded template files.
 *
 * Current implementation: LocalTemplateStorage — saves files to the local
 * filesystem under /public/uploads/templates/.
 *
 * To migrate to cloud storage (Vercel Blob, AWS S3, etc.):
 *   1. Implement the ITemplateStorage interface in a new class.
 *   2. Swap the `templateStorage` export below.
 *   3. For Vercel Blob: install @vercel/blob and set BLOB_READ_WRITE_TOKEN.
 *      See: https://vercel.com/docs/storage/vercel-blob
 *
 * NOTE: Local filesystem storage does NOT persist across Vercel deployments.
 * For production, replace with a cloud provider before going live.
 */

import { mkdir, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { UploadedFile, MimeTypeTemplate } from '@/lib/types/templates'

// ─── Allowed MIME types ───────────────────────────────────────────────────────

const ALLOWED_MIMES: Record<string, MimeTypeTemplate> = {
  'application/pdf':
    'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain': 'text/plain',
}

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

// ─── Interface contract ───────────────────────────────────────────────────────

export interface ITemplateStorage {
  /**
   * Persist a file and return metadata.
   * Throws if MIME type is not allowed or file exceeds MAX_BYTES.
   */
  save(file: File): Promise<UploadedFile>

  /**
   * Remove a previously stored file.
   * No-op if the file does not exist.
   */
  remove(storagePath: string): Promise<void>
}

// ─── Local implementation ─────────────────────────────────────────────────────

class LocalTemplateStorage implements ITemplateStorage {
  private readonly uploadDir: string
  private readonly publicPrefix: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates')
    this.publicPrefix = '/uploads/templates'
  }

  async save(file: File): Promise<UploadedFile> {
    // Validate MIME
    const mime = ALLOWED_MIMES[file.type]
    if (!mime) {
      throw new Error(
        `Tipo de arquivo não suportado: ${file.type}. Use PDF, DOCX ou TXT.`,
      )
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      throw new Error(
        `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: 20 MB.`,
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeFilename}`

    await mkdir(this.uploadDir, { recursive: true })
    await writeFile(path.join(this.uploadDir, filename), buffer)

    return {
      originalName: file.name,
      storagePath: `${this.publicPrefix}/${filename}`,
      mimeType: mime,
      tamanhoBytes: file.size,
    }
  }

  async remove(storagePath: string): Promise<void> {
    // storagePath is a public URL path, e.g. /uploads/templates/filename.pdf
    const filename = storagePath.split('/').pop()
    if (!filename) return
    const fullPath = path.join(this.uploadDir, filename)
    if (existsSync(fullPath)) {
      await unlink(fullPath)
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const templateStorage: ITemplateStorage = new LocalTemplateStorage()
