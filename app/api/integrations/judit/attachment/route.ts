/**
 * GET /api/integrations/judit/attachment?id=<attachmentId>
 *
 * Proxy de download para anexos.
 * - blobUrl → redirect (publico)
 * - url Judit → proxy com api-key (autenticado)
 * Protegido por auth + ownership check.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { juditConfig } from '@/lib/integrations/judit/config'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const url = new URL(req.url)
  const attachmentId = url.searchParams.get('id')?.trim()
  if (!attachmentId) {
    return NextResponse.json({ error: 'Query param "id" required' }, { status: 400 })
  }

  const att = await prisma.processAttachment.findUnique({ where: { id: attachmentId } })
  if (!att) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const pericia = await prisma.pericia.findUnique({
    where: { id: att.periciaId },
    select: { peritoId: true },
  })
  if (!pericia || pericia.peritoId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // blobUrl → redirect direto (público)
  if (att.blobUrl) {
    return NextResponse.redirect(att.blobUrl)
  }

  // url Judit → proxy com api-key
  if (att.url) {
    try {
      const res = await fetch(att.url, {
        headers: { 'api-key': juditConfig.apiKey },
        redirect: 'follow',
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Download failed' }, { status: 502 })
      }
      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${att.name}.${att.type ?? 'pdf'}"`,
        },
      })
    } catch {
      return NextResponse.json({ error: 'Download error' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'File not available' }, { status: 404 })
}
