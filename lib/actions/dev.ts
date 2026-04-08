'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function limparDadosTeste(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    // Usa SQL direto para evitar problemas de connection pool (pgBouncer)
    // Ordem: do mais dependente para o menos dependente

    // 1. CheckpointMidia (depende de Checkpoint → RotaPericia)
    await prisma.$executeRaw`
      DELETE FROM "CheckpointMidia"
      WHERE "checkpointId" IN (
        SELECT c.id FROM "Checkpoint" c
        JOIN "RotaPericia" r ON r.id = c."rotaId"
        WHERE r."peritoId" = ${userId}
      )
    `

    // 2. Checkpoints
    await prisma.$executeRaw`
      DELETE FROM "Checkpoint"
      WHERE "rotaId" IN (
        SELECT id FROM "RotaPericia" WHERE "peritoId" = ${userId}
      )
    `

    // 3. Rotas
    await prisma.$executeRaw`DELETE FROM "RotaPericia" WHERE "peritoId" = ${userId}`

    // 4. Nomeações / citações
    await prisma.$executeRaw`DELETE FROM "NomeacaoCitacao" WHERE "peritoId" = ${userId}`

    // 5. Visitas de prospecção
    await prisma.$executeRaw`DELETE FROM "ProspeccaoVisita" WHERE "peritoId" = ${userId}`

    // 6. Péricias
    await prisma.$executeRaw`DELETE FROM "Pericia" WHERE "peritoId" = ${userId}`

    // 7. Propostas e demandas
    await prisma.$executeRaw`DELETE FROM "Proposta" WHERE "userId" = ${userId}`
    await prisma.$executeRaw`DELETE FROM "DemandaParceiro" WHERE "userId" = ${userId}`

    // 8. Varas e radar
    await prisma.$executeRaw`DELETE FROM "TribunalVara" WHERE "peritoId" = ${userId}`
    await prisma.$executeRaw`DELETE FROM "RadarConfig" WHERE "peritoId" = ${userId}`

    // 9. Reset PeritoPerfil
    await prisma.$executeRaw`
      UPDATE "PeritoPerfil" SET
        telefone = NULL,
        formacao = NULL,
        "formacaoCustom" = NULL,
        registro = NULL,
        especialidades = '[]',
        cursos = '[]',
        tribunais = '[]',
        estados = '[]',
        cidade = NULL,
        estado = NULL,
        "areaAtuacao" = NULL,
        "perfilCompleto" = false,
        "credenciaisTribunais" = '{}'
      WHERE "userId" = ${userId}
    `

    return { ok: true }
  } catch (err) {
    console.error('[limparDadosTeste]', err)
    const msg = err instanceof Error ? err.message.slice(0, 120) : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}
