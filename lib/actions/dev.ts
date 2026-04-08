'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function limparDadosTeste(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  const erros: string[] = []

  async function safe(label: string, fn: () => Promise<unknown>) {
    try { await fn() } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      erros.push(`${label}: ${msg}`)
      console.error(`[limparDados] ${label}:`, msg)
    }
  }

  // 1. Citações de nomeação
  await safe('nomeacaoCitacao', () =>
    prisma.nomeacaoCitacao.deleteMany({ where: { peritoId: userId } })
  )

  // 2. Visitas de prospecção
  await safe('prospeccaoVisita', () =>
    prisma.prospeccaoVisita.deleteMany({ where: { peritoId: userId } })
  )

  // 3. Checkpoints midias → checkpoints → rotas
  const rotas = await prisma.rotaPericia.findMany({ where: { peritoId: userId }, select: { id: true } }).catch(() => [])
  const rotaIds = rotas.map((r) => r.id)
  if (rotaIds.length > 0) {
    const cps = await prisma.checkpoint.findMany({ where: { rotaId: { in: rotaIds } }, select: { id: true } }).catch(() => [])
    const cpIds = cps.map((c) => c.id)
    if (cpIds.length > 0) {
      await safe('checkpointMidia', () =>
        prisma.checkpointMidia.deleteMany({ where: { checkpointId: { in: cpIds } } })
      )
    }
    await safe('checkpoint', () =>
      prisma.checkpoint.deleteMany({ where: { rotaId: { in: rotaIds } } })
    )
  }
  await safe('rotaPericia', () =>
    prisma.rotaPericia.deleteMany({ where: { peritoId: userId } })
  )

  // 4. Péricias
  await safe('pericia', () =>
    prisma.pericia.deleteMany({ where: { peritoId: userId } })
  )

  // 5. Propostas e demandas
  await safe('proposta', () =>
    prisma.proposta.deleteMany({ where: { userId } })
  )
  await safe('demandaParceiro', () =>
    prisma.demandaParceiro.deleteMany({ where: { userId } })
  )

  // 6. Varas vinculadas ao perito
  await safe('tribunalVara', () =>
    prisma.tribunalVara.deleteMany({ where: { peritoId: userId } })
  )

  // 7. Radar config
  await safe('radarConfig', () =>
    prisma.radarConfig.deleteMany({ where: { peritoId: userId } })
  )

  // 8. Reset PeritoPerfil para estado inicial
  await safe('peritoPerfil.upsert', () =>
    prisma.peritoPerfil.upsert({
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
        credenciaisTribunais: '{}',
      },
    })
  )

  if (erros.length > 0) {
    return { ok: false, error: `Parcial — ${erros.length} erro(s): ${erros[0]}` }
  }
  return { ok: true }
}
