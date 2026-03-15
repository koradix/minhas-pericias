import { prisma } from '@/lib/prisma'

export async function getDocumentosGerados() {
  return prisma.documentoGerado.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDocumentoById(id: string) {
  return prisma.documentoGerado.findUnique({ where: { id } })
}
