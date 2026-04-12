/**
 * GET /api/integrations/judit/attachment?id=<attachmentId>
 *
 * Proxy de download para anexos ja salvos no Vercel Blob.
 * Se o blob nao existir, retorna 404.
 * Protegido por auth + ownership check.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

  // Ownership: verificar que o perito eh dono da pericia
  const pericia = await prisma.pericia.findUnique({
    where: { id: att.periciaId },
    select: { peritoId: true },
  })
  if (!pericia || pericia.peritoId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Se tem blobUrl, redirecionar
  if (att.blobUrl) {
    return NextResponse.redirect(att.blobUrl)
  }

  // Se tem URL original mas nao foi baixado ainda
  if (att.url) {
    return NextResponse.redirect(att.url)
  }

  return NextResponse.json({ error: 'File not available' }, { status: 404 })
}
