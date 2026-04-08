'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function limparDadosTeste(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete related data in the right order
      // 1. Citações e documentos
      await tx.nomeacaoCitacao.deleteMany({ where: { peritoId: userId } })
      // 2. Documentos gerados (sem userId no schema — skip)
      // await tx.documentoGerado.deleteMany({ where: { userId } }).catch(() => {})
      // 3. Propostas / demandas (se existirem)
      await tx.proposta.deleteMany({ where: { userId } }).catch(() => {})
      await tx.demandaParceiro.deleteMany({ where: { userId } }).catch(() => {})
      // 4. Visitas de prospecção
      await tx.prospeccaoVisita.deleteMany({ where: { peritoId: userId } }).catch(() => {})
      // 5. Checkpoints e midias de rotas
      const rotas = await tx.rotaPericia.findMany({ where: { peritoId: userId }, select: { id: true } })
      const rotaIds = rotas.map((r) => r.id)
      if (rotaIds.length > 0) {
        const cps = await tx.checkpoint.findMany({ where: { rotaId: { in: rotaIds } }, select: { id: true } })
        const cpIds = cps.map((c) => c.id)
        if (cpIds.length > 0) await tx.checkpointMidia.deleteMany({ where: { checkpointId: { in: cpIds } } })
        await tx.checkpoint.deleteMany({ where: { rotaId: { in: rotaIds } } })
      }
      await tx.rotaPericia.deleteMany({ where: { peritoId: userId } })
      // 6. Péricias / intakes
      await tx.pericia.deleteMany({ where: { peritoId: userId } }).catch(() => {})
      // pericoIntake não existe no schema atual
      // 7. Varas vinculadas ao perito
      await tx.tribunalVara.deleteMany({ where: { peritoId: userId } }).catch(() => {})
      // 8. Radar config
      await tx.radarConfig.deleteMany({ where: { peritoId: userId } }).catch(() => {})
      // 9. Reset PeritoPerfil para estado inicial
      await tx.peritoPerfil.upsert({
        where: { userId },
        create: { userId },
        update: {
          telefone: null,
          formacao: null,
          formacaoCustom: null,
          registro: null,
          especialidades: '[]',
          cursos: '[]',
          tribunais: '[]',
          estados: '[]',
          cidade: null,
          estado: null,
          areaAtuacao: null,
          perfilCompleto: false,
        },
      })
    })

    return { ok: true }
  } catch (err) {
    console.error('[limparDadosTeste]', err)
    return { ok: false, error: 'Erro ao limpar dados' }
  }
}
