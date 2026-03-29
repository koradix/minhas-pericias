'use server'

import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'
import type { CitacaoResult } from '@/lib/services/radar-provider'

// ─── Snippet filter — mesma lógica de nomeacoes.ts ────────────────────────────

function isSnippetNomeacao(snippet: string): boolean {
  return /per[íi]c|perito|vistori|nomea|designa|expert|laudo/.test(
    snippet.toLowerCase(),
  )
}

// ─── Shared persistence — usada pelo botão e pelos crons ─────────────────────

export async function persistirCitacoes(
  peritoId: string,
  citacoes: CitacaoResult[],
  fonte: 'monitor' | 'busca_ativa',
): Promise<number> {
  // Dedup em memória antes de ir ao banco
  const seen = new Set<string>()
  const unicas = citacoes.filter((c) => {
    if (seen.has(c.externalId)) return false
    seen.add(c.externalId)
    return true
  })

  const relevantes = unicas.filter((c) => isSnippetNomeacao(c.snippet))

  // Lookup de varas para linking
  const varasBySigla = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true },
    select: { id: true, tribunalSigla: true, varaNome: true },
  })
  const varaIdMap = new Map(
    varasBySigla.map((v) => [v.tribunalSigla.toUpperCase(), v.id]),
  )

  let novas = 0

  for (const c of relevantes) {
    const exists = await prisma.nomeacaoCitacao.findUnique({
      where: { peritoId_externalId: { peritoId, externalId: c.externalId } },
      select: { id: true },
    })
    if (exists) continue

    const tribunalVaraId = varaIdMap.get(c.diarioSigla.toUpperCase()) ?? null

    try {
      await prisma.nomeacaoCitacao.create({
        data: {
          peritoId,
          externalId: c.externalId,
          diarioSigla: c.diarioSigla,
          diarioNome: c.diarioNome,
          diarioData: new Date(c.diarioData),
          snippet: c.snippet,
          numeroProcesso: c.numeroProcesso ?? null,
          linkCitacao: c.linkCitacao,
          fonte,
          tribunalVaraId,
        },
      })

      if (tribunalVaraId) {
        await prisma.tribunalVara.update({
          where: { id: tribunalVaraId },
          data: { totalNomeacoes: { increment: 1 } },
        })
        const vara = varasBySigla.find((v) => v.id === tribunalVaraId)
        if (vara) {
          await prisma.varaStats.upsert({
            where: {
              tribunalSigla_varaNome: {
                tribunalSigla: vara.tribunalSigla,
                varaNome: vara.varaNome,
              },
            },
            create: {
              tribunalSigla: vara.tribunalSigla,
              varaNome: vara.varaNome,
              totalNomeacoes: 1,
            },
            update: { totalNomeacoes: { increment: 1 } },
          })
        }
      }

      novas++
    } catch (err) {
      // Unique constraint race — skip silently
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('Unique constraint')) {
        console.error(`[radar-sync] Erro ao criar citação ${c.externalId}:`, err)
      }
    }
  }

  return novas
}

// ─── Initial backfill — roda UMA VEZ por perito ───────────────────────────────
// Busca 2 meses de histórico (buscarPorNome já usa janela de 1 ano, cobrindo os 2 meses)
// Só executa se backfillCompletedAt == null

export async function runInitialBackfill(peritoId: string): Promise<void> {
  const config = await prisma.radarConfig.findUnique({
    where: { peritoId },
    select: {
      backfillCompletedAt: true,
      tribunaisMonitorados: true,
      monitoramentoExtId: true,
    },
  })

  if (!config) return
  if (config.backfillCompletedAt) {
    console.log(`[backfill] Já completado para ${peritoId}, skip`)
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: peritoId },
    select: { name: true },
  })
  const nome = user?.name?.trim() ?? ''
  if (!nome) {
    console.error(`[backfill] Nome não encontrado para ${peritoId}`)
    return
  }

  const siglas: string[] = JSON.parse(config.tribunaisMonitorados || '[]')

  console.log(`[backfill] Iniciando para "${nome}" — ${siglas.length} tribunais`)

  let totalNovas = 0

  // 1. FREE: aparições do monitoramento (se existir)
  if (config.monitoramentoExtId) {
    try {
      const fromMonitor = await radar.buscarCitacoes(config.monitoramentoExtId)
      const novas = await persistirCitacoes(peritoId, fromMonitor, 'monitor')
      totalNovas += novas
      console.log(`[backfill] Monitor: ${novas} novas de ${fromMonitor.length}`)
    } catch (err) {
      console.error(`[backfill] Erro no monitor:`, err)
    }
  }

  // 2. PAID: busca histórica por nome (janela de 1 ano — cobre os 2 meses obrigatórios)
  try {
    const fromBusca = await radar.buscarPorNome(nome, siglas)
    const novas = await persistirCitacoes(peritoId, fromBusca, 'busca_ativa')
    totalNovas += novas
    console.log(`[backfill] Busca ativa: ${novas} novas de ${fromBusca.length}`)
  } catch (err) {
    console.error(`[backfill] Erro na busca ativa:`, err)
    // Não marca como completo se a busca paga falhou
    return
  }

  await prisma.radarConfig.update({
    where: { peritoId },
    data: {
      backfillCompletedAt: new Date(),
      lastSearchSyncAt: new Date(),
      lastMonitorSyncAt: config.monitoramentoExtId ? new Date() : undefined,
      ultimaBusca: new Date(),
      totalCitacoes: {
        increment: totalNovas,
      },
    },
  })

  console.log(`[backfill] Concluído para ${peritoId} — ${totalNovas} citações novas`)
}

// ─── Daily sync — FREE, aparições do monitoramento ───────────────────────────

export async function runDailySync(peritoId: string): Promise<{ novas: number; total: number }> {
  const config = await prisma.radarConfig.findUnique({
    where: { peritoId },
    select: { monitoramentoExtId: true, lastMonitorSyncAt: true },
  })

  if (!config?.monitoramentoExtId) {
    return { novas: 0, total: 0 }
  }

  // Idempotência: skip se rodou nas últimas 20h
  if (config.lastMonitorSyncAt) {
    const diffHoras = (Date.now() - config.lastMonitorSyncAt.getTime()) / 3_600_000
    if (diffHoras < 20) {
      console.log(`[daily] ${peritoId} sincronizado há ${diffHoras.toFixed(1)}h, skip`)
      return { novas: -1, total: 0 } // -1 = skipped
    }
  }

  const citacoes = await radar.buscarCitacoes(config.monitoramentoExtId)
  const novas = await persistirCitacoes(peritoId, citacoes, 'monitor')

  await prisma.radarConfig.update({
    where: { peritoId },
    data: {
      lastMonitorSyncAt: new Date(),
      ultimaBusca: new Date(),
      totalCitacoes: { increment: novas },
    },
  })

  console.log(`[daily] ${peritoId} → ${novas} novas de ${citacoes.length}`)
  return { novas, total: citacoes.length }
}

// ─── Weekly sync — PAID, busca por nome ──────────────────────────────────────

export async function runWeeklySync(peritoId: string): Promise<{ novas: number; total: number }> {
  const config = await prisma.radarConfig.findUnique({
    where: { peritoId },
    select: {
      lastSearchSyncAt: true,
      backfillCompletedAt: true,
      tribunaisMonitorados: true,
    },
  })

  if (!config) return { novas: 0, total: 0 }

  // Idempotência: skip se rodou nos últimos 6 dias
  if (config.lastSearchSyncAt) {
    const diffDias = (Date.now() - config.lastSearchSyncAt.getTime()) / 86_400_000
    if (diffDias < 6) {
      console.log(`[weekly] ${peritoId} sincronizado há ${diffDias.toFixed(1)}d, skip`)
      return { novas: -1, total: 0 }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: peritoId },
    select: { name: true },
  })
  const nome = user?.name?.trim() ?? ''
  if (!nome) return { novas: 0, total: 0 }

  const siglas: string[] = JSON.parse(config.tribunaisMonitorados || '[]')

  const citacoes = await radar.buscarPorNome(nome, siglas)
  const novas = await persistirCitacoes(peritoId, citacoes, 'busca_ativa')

  await prisma.radarConfig.update({
    where: { peritoId },
    data: {
      lastSearchSyncAt: new Date(),
      ultimaBusca: new Date(),
      totalCitacoes: { increment: novas },
    },
  })

  console.log(`[weekly] ${peritoId} → ${novas} novas de ${citacoes.length}`)
  return { novas, total: citacoes.length }
}
