'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorError, type CitacaoResult } from '@/lib/services/radar-provider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVariacoes(nome: string, cpf?: string | null): string[] {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  const vars: string[] = []
  if (parts.length >= 2) vars.push(`${parts[0]} ${parts[parts.length - 1]}`) // first + last
  if (parts.length >= 1) vars.push(parts[0]) // first name
  // Use CPF as 3rd variation (diários sometimes list CPF alongside name)
  const cpfDigits = cpf?.replace(/\D/g, '') ?? ''
  if (cpfDigits.length === 11) {
    vars.push(cpf!.trim()) // formatted CPF e.g. "123.456.789-00"
  } else if (parts.length >= 2) {
    vars.push(parts[parts.length - 1]) // surname fallback
  }
  return vars.slice(0, 3)
}

// ─── Action 1 — Setup radar ───────────────────────────────────────────────────

export type SetupRadarResult =
  | { status: 'already_configured' }
  | { status: 'created' }
  | { status: 'recovered' }
  | { status: 'error'; message: string }

function humanReadableError(e: unknown): string {
  if (e instanceof EscavadorError) {
    if (e.code === 401) return 'Token de API inválido. Verifique as configurações.'
    if (e.code === 402) return 'Saldo insuficiente na API Escavador.'
    if (e.code === 404) return 'Recurso não encontrado na API.'
    if (e.message.includes('422')) return 'Configuração já existe. Tente recarregar a página.'
    return 'Erro temporário. Tente novamente.'
  }
  if (e instanceof Error) {
    if (e.message.includes('422')) return 'Configuração já existe. Tente recarregar a página.'
    if (e.message.toLowerCase().includes('tribunal')) return e.message
    if (e.message.toLowerCase().includes('perfil')) return e.message
    return 'Erro inesperado. Tente novamente.'
  }
  return 'Erro inesperado. Tente novamente.'
}

export async function setupRadar(): Promise<SetupRadarResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { status: 'error', message: 'Não autenticado' }

  try {
    // Step 1 — if already configured locally, skip the entire API flow
    const config = await prisma.radarConfig.findUnique({ where: { peritoId: userId } })
    if (config?.monitoramentoExtId) {
      revalidatePath('/nomeacoes')
      return { status: 'already_configured' }
    }

    const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
    if (!peritoPerfil) return { status: 'error', message: 'Perfil não encontrado' }

    const nomePeito = session.user?.name ?? peritoPerfil.cidade ?? 'Perito'
    const cpf = (peritoPerfil as { cpf?: string | null }).cpf ?? null
    const siglas: string[] = JSON.parse(peritoPerfil.tribunais || '[]')
    if (siglas.length === 0) return { status: 'error', message: 'Nenhum tribunal registrado no perfil' }

    const resolvidos = await radar.resolverTribunais(siglas)
    const suportados = resolvidos.filter((t) => t.suportaBusca)
    const ignorados = resolvidos.filter((t) => !t.suportaBusca).map((t) => t.sigla)
    const ids = suportados.map((t) => t.escavadorId).filter((id): id is number => id !== undefined)

    // Step 2 — check Escavador for existing monitoramento (FREE, avoids 422)
    if (ids.length > 0) {
      const existentes = await radar.listMonitoramentos()
      const termoNorm = nomePeito.toLowerCase().trim()
      const found = existentes.find((m) => {
        const t = (m.termo ?? '').toLowerCase().trim()
        return t === termoNorm || t.includes(termoNorm) || termoNorm.includes(t)
      })
      if (found) {
        await prisma.radarConfig.upsert({
          where: { peritoId: userId },
          update: { monitoramentoExtId: String(found.id), tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
          create: { peritoId: userId, monitoramentoExtId: String(found.id), tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
        })
        revalidatePath('/nomeacoes')
        return { status: 'recovered' }
      }
    }

    // Step 3 — create new monitoring
    let monitoramentoExtId: string | null = null
    if (ids.length > 0) {
      try {
        monitoramentoExtId = await radar.criarMonitoramento(nomePeito, ids, buildVariacoes(nomePeito, cpf))
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('422') || (e instanceof EscavadorError && msg.includes('422'))) {
          // Last resort — list one more time
          const retry = await radar.listMonitoramentos()
          const termoNorm = nomePeito.toLowerCase().trim()
          const match = retry.find((m) => {
            const t = (m.termo ?? '').toLowerCase().trim()
            return t === termoNorm || t.includes(termoNorm) || termoNorm.includes(t)
          })
          if (match) {
            await prisma.radarConfig.upsert({
              where: { peritoId: userId },
              update: { monitoramentoExtId: String(match.id), tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
              create: { peritoId: userId, monitoramentoExtId: String(match.id), tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
            })
            revalidatePath('/nomeacoes')
            return { status: 'recovered' }
          }
        }
        return { status: 'error', message: humanReadableError(e) }
      }
    }

    await prisma.radarConfig.upsert({
      where: { peritoId: userId },
      update: { tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados), monitoramentoExtId: monitoramentoExtId ?? undefined },
      create: { peritoId: userId, tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados), monitoramentoExtId: monitoramentoExtId ?? undefined },
    })

    revalidatePath('/nomeacoes')
    return { status: 'created' }
  } catch (err) {
    return { status: 'error', message: humanReadableError(err) }
  }
}

// ─── Action 2 — Buscar nomeações (triggered only by user click) ───────────────

export type BuscarResult =
  | { ok: true; novas: number; saldoRestante: number }
  | { ok: false; novas: 0; error: string }

export async function buscarNomeacoes(): Promise<BuscarResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, novas: 0, error: 'Não autenticado' }

  try {
    const config = await prisma.radarConfig.findUnique({ where: { peritoId: userId } })
    if (!config) return { ok: false, novas: 0, error: 'Radar não configurado' }

    const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
    const nomePeito = session.user?.name ?? ''
    const cpfPerfil = (peritoPerfil as { cpf?: string | null })?.cpf ?? null

    // ── Check saldo before any paid endpoint ────────────────────────────────
    const saldoInfo = await radar.verificarSaldo()

    // Update last known balance
    await prisma.radarConfig.update({
      where: { peritoId: userId },
      data: { saldoUltimaVerif: saldoInfo.saldo },
    })

    if (saldoInfo.saldo === 0) {
      return { ok: false, novas: 0, error: 'Saldo insuficiente na API Escavador' }
    }

    const siglasFiltro: string[] = JSON.parse(config.tribunaisMonitorados || '[]')
    const citacoes: CitacaoResult[] = []

    // ── FREE: monitoring appearances ─────────────────────────────────────────
    if (config.monitoramentoExtId) {
      try {
        const fromMonitor = await radar.buscarCitacoes(config.monitoramentoExtId)
        citacoes.push(...fromMonitor)
      } catch {
        // Non-blocking: monitoring might not have results yet
      }
    }

    // ── PAID: full text search ────────────────────────────────────────────────
    const fromBusca = await radar.buscarPorNome(nomePeito, siglasFiltro)
    citacoes.push(...fromBusca)

    // If CPF is set, also search by CPF (some diários list CPF alongside the name)
    if (cpfPerfil && cpfPerfil.replace(/\D/g, '').length === 11) {
      try {
        const fromCpf = await radar.buscarPorNome(cpfPerfil, siglasFiltro)
        citacoes.push(...fromCpf)
      } catch {
        // Non-blocking — CPF search failure doesn't abort
      }
    }

    // ── Dedup by externalId ──────────────────────────────────────────────────
    const seen = new Set<string>()
    const unique = citacoes.filter((c) => {
      if (seen.has(c.externalId)) return false
      seen.add(c.externalId)
      return true
    })

    // ── Verify updated saldo after paid call ─────────────────────────────────
    const saldoPos = await radar.verificarSaldo()

    // ── Build sigla → TribunalVara.id lookup for linking ─────────────────────
    const varasBySigla = await prisma.tribunalVara.findMany({
      where: { peritoId: userId, ativa: true },
      select: { id: true, tribunalSigla: true },
    })
    const varaIdBySigla = new Map(varasBySigla.map((v) => [v.tribunalSigla.toUpperCase(), v.id]))

    // ── Upsert citações (@@unique prevents duplicates) ───────────────────────
    let novas = 0
    for (const c of unique) {
      const existing = await prisma.nomeacaoCitacao.findUnique({
        where: { peritoId_externalId: { peritoId: userId, externalId: c.externalId } },
      })
      if (!existing) {
        const tribunalVaraId = varaIdBySigla.get(c.diarioSigla.toUpperCase()) ?? null
        await prisma.nomeacaoCitacao.create({
          data: {
            peritoId: userId,
            externalId: c.externalId,
            diarioSigla: c.diarioSigla,
            diarioNome: c.diarioNome,
            diarioData: new Date(c.diarioData),
            snippet: c.snippet,
            numeroProcesso: c.numeroProcesso ?? null,
            linkCitacao: c.linkCitacao,
            tribunalVaraId,
          },
        })

        // Increment TribunalVara.totalNomeacoes if linked
        if (tribunalVaraId) {
          await prisma.tribunalVara.update({
            where: { id: tribunalVaraId },
            data: { totalNomeacoes: { increment: 1 } },
          })

          // Upsert platform-wide VaraStats
          const vara = varasBySigla.find((v) => v.id === tribunalVaraId)
          if (vara) {
            const varaRow = await prisma.tribunalVara.findUnique({
              where: { id: tribunalVaraId },
              select: { varaNome: true },
            })
            if (varaRow) {
              await prisma.varaStats.upsert({
                where: { tribunalSigla_varaNome: { tribunalSigla: vara.tribunalSigla, varaNome: varaRow.varaNome } },
                create: { tribunalSigla: vara.tribunalSigla, varaNome: varaRow.varaNome, totalNomeacoes: 1 },
                update: { totalNomeacoes: { increment: 1 } },
              })
            }
          }
        }

        novas++
      }
    }

    // ── Update config stats ──────────────────────────────────────────────────
    const totalCitacoes = await prisma.nomeacaoCitacao.count({ where: { peritoId: userId } })
    await prisma.radarConfig.update({
      where: { peritoId: userId },
      data: {
        ultimaBusca: new Date(),
        totalCitacoes,
        saldoUltimaVerif: saldoPos.saldo,
      },
    })

    revalidatePath('/nomeacoes')
    return { ok: true, novas, saldoRestante: saldoPos.saldo }
  } catch (err) {
    if (err instanceof EscavadorError) {
      if (err.code === 402) return { ok: false, novas: 0, error: 'Saldo insuficiente na API Escavador' }
      if (err.code === 401) return { ok: false, novas: 0, error: 'Token de API inválido' }
      return { ok: false, novas: 0, error: 'Erro ao buscar. Tente novamente.' }
    }
    return { ok: false, novas: 0, error: 'Erro ao buscar. Tente novamente.' }
  }
}

// ─── Action 3 — Marcar como visualizado ──────────────────────────────────────

export async function marcarVisualizado(citacaoId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.nomeacaoCitacao.updateMany({
    where: { id: citacaoId, peritoId: session.user.id },
    data: { visualizado: true },
  })

  revalidatePath('/nomeacoes')
  revalidatePath('/dashboard')
}

// ─── Action 4 — Marcar todas como visualizadas ───────────────────────────────

export async function marcarTodasVisualizadas(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.nomeacaoCitacao.updateMany({
    where: { peritoId: session.user.id, visualizado: false },
    data: { visualizado: true },
  })

  revalidatePath('/nomeacoes')
  revalidatePath('/dashboard')
}

// ─── Action 5 — Manual citacao (fallback when API unavailable) ───────────────

export type ManualCitacaoInput = {
  diarioSigla: string
  diarioData: string // YYYY-MM-DD
  snippetTexto: string
  numeroProcesso?: string
}

export async function criarCitacaoManual(data: ManualCitacaoInput): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const externalId = `manual-${crypto.randomUUID()}`
    await prisma.nomeacaoCitacao.create({
      data: {
        peritoId: userId,
        externalId,
        diarioSigla: data.diarioSigla,
        diarioNome: data.diarioSigla,
        diarioData: new Date(data.diarioData),
        snippet: data.snippetTexto,
        numeroProcesso: data.numeroProcesso ?? null,
        linkCitacao: '',
        fonte: 'manual',
      },
    })

    // Update totalCitacoes
    const total = await prisma.nomeacaoCitacao.count({ where: { peritoId: userId } })
    await prisma.radarConfig.updateMany({
      where: { peritoId: userId },
      data: { totalCitacoes: total },
    })

    revalidatePath('/nomeacoes')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
