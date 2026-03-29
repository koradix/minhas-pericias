'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'
import { EscavadorError, type CitacaoResult } from '@/lib/services/radar-provider'
import { calcularScore, type PerfilMatch } from '@/lib/utils/match-nomeacao'
import { runInitialBackfill } from '@/lib/actions/radar-sync'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVariacoes(nome: string, cpf?: string | null): string[] {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  const vars: string[] = []
  if (parts.length >= 2) vars.push(`${parts[0]} ${parts[parts.length - 1]}`) // first + last
  if (parts.length >= 1) vars.push(parts[0]) // first name
  const cpfDigits = cpf?.replace(/\D/g, '') ?? ''
  if (cpfDigits.length === 11) {
    vars.push(cpf!.trim())
  } else if (parts.length >= 2) {
    vars.push(parts[parts.length - 1])
  }
  return vars.slice(0, 3)
}

/** Retorna true se o sigla pertence a um tribunal estadual cível (TJ*). */
function isTribunalCivel(sigla: string): boolean {
  return sigla.toUpperCase().startsWith('TJ')
}

/**
 * Retorna true se o snippet provavelmente menciona nomeação de perito.
 * Intencionalmente permissivo — melhor salvar um falso positivo do que perder
 * uma nomeação real. O usuário pode arquivar o que não for relevante.
 */
function isSnippetNomeacaoCivel(snippet: string): boolean {
  const lower = snippet.toLowerCase()
  // Qualquer menção a perícia, perito, vistoria, nomeação ou designação
  return /per[íi]c|perito|vistori|nomea|designa|expert|laudo/.test(lower)
}

/** Busca o nome completo do usuário diretamente do banco (fonte mais confiável). */
async function getNomePeito(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  return user?.name?.trim() ?? ''
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

    // Nome do cadastro — fonte primária: banco de dados (User.name)
    const nomePeito = await getNomePeito(userId)
    if (!nomePeito) return { status: 'error', message: 'Nome não cadastrado no perfil' }

    const cpf = (peritoPerfil as { cpf?: string | null }).cpf ?? null

    // Filtra apenas tribunais estaduais cíveis (TJ*)
    const todasSiglas: string[] = JSON.parse(peritoPerfil.tribunais || '[]')
    const siglas = todasSiglas.filter(isTribunalCivel)
    if (siglas.length === 0) return { status: 'error', message: 'Nenhum tribunal estadual (TJ) registrado no perfil' }

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
        runInitialBackfill(userId).catch((e) =>
          console.error('[setupRadar] backfill error (recovered):', e),
        )
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
            runInitialBackfill(userId).catch((e2) =>
              console.error('[setupRadar] backfill error (422-recovered):', e2),
            )
            return { status: 'recovered' }
          }
        }
        // 401 = plano sem monitoramento: salva config parcial para permitir busca ativa
        if (e instanceof EscavadorError && e.code === 401) {
          await prisma.radarConfig.upsert({
            where: { peritoId: userId },
            update: { tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
            create: { peritoId: userId, tribunaisMonitorados: JSON.stringify(siglas), tribunaisResolvidos: JSON.stringify(resolvidos), tribunaisIgnorados: JSON.stringify(ignorados) },
          })
          revalidatePath('/nomeacoes')
          console.log('[setupRadar] monitoramento 401 — config parcial salvo, busca ativa disponível')
          return { status: 'error', message: 'Monitoramento automático não disponível no plano atual. Busca ativa funcionando.' }
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

    // Kick off initial backfill in background — non-blocking
    runInitialBackfill(userId).catch((e) =>
      console.error('[setupRadar] backfill error:', e),
    )

    return { status: 'created' }
  } catch (err) {
    return { status: 'error', message: humanReadableError(err) }
  }
}

// ─── Action — Adicionar processo manualmente a partir de citação Escavador ────
// Chamada pelo usuário ao clicar "Adicionar processo" em uma citação.

export type AdicionarProcessoResult =
  | { ok: true; nomeacaoId: string }
  | { ok: false; error: string }

export async function adicionarProcessoDaCitacao(
  citacaoId: string,
): Promise<AdicionarProcessoResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const citacao = await prisma.nomeacaoCitacao.findUnique({ where: { id: citacaoId } })
    if (!citacao || citacao.peritoId !== userId) return { ok: false, error: 'Citação não encontrada' }
    if (!citacao.numeroProcesso) return { ok: false, error: 'Citação não possui número de processo' }

    const { numeroProcesso, diarioSigla, snippet, linkCitacao } = citacao

    // Verifica se já existe Nomeacao para este processo
    const processoExistente = await prisma.processo.findUnique({ where: { numeroProcesso } })
    if (processoExistente) {
      const nomeacaoExistente = await prisma.nomeacao.findUnique({
        where: { peritoId_processoId: { peritoId: userId, processoId: processoExistente.id } },
      })
      if (nomeacaoExistente) return { ok: true, nomeacaoId: nomeacaoExistente.id }
    }

    // ── Busca dados completos do processo no Escavador ─────────────────────
    let processoFields: {
      tribunal: string; classe: string | null; assunto: string | null
      orgaoJulgador: string | null; dataDistribuicao: string | null
      dataUltimaAtu: string | null; partes: string
    } = {
      tribunal: diarioSigla, classe: null, assunto: snippet.substring(0, 200) || null,
      orgaoJulgador: null, dataDistribuicao: null,
      dataUltimaAtu: new Date().toISOString().split('T')[0], partes: '[]',
    }

    try {
      const escavador = radar as EscavadorService
      const processoEscavador = await escavador.buscarProcesso(numeroProcesso, diarioSigla)
      if (processoEscavador) {
        processoFields = {
          tribunal:         processoEscavador.tribunal ?? diarioSigla,
          classe:           processoEscavador.titulo ?? null,
          assunto:          processoEscavador.assunto ?? null,
          orgaoJulgador:    processoEscavador.orgao_julgador ?? null,
          dataDistribuicao: processoEscavador.data_distribuicao ?? null,
          dataUltimaAtu:    processoEscavador.data_ultima_movimentacao ?? processoFields.dataUltimaAtu,
          partes: JSON.stringify(processoEscavador.partes.map((p) => ({ nome: p.nome, tipo: p.tipo_parte }))),
        }
      }
    } catch {
      // Escavador unavailable — usa dados mínimos da citação
    }

    // ── Upsert Processo ────────────────────────────────────────────────────
    const processo = await prisma.processo.upsert({
      where:  { numeroProcesso },
      update: { ...processoFields, atualizadoEm: new Date() },
      create: { numeroProcesso, ...processoFields },
    })

    // ── Score de compatibilidade ───────────────────────────────────────────
    const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
    let scoreMatch = 0
    if (peritoPerfil) {
      const perfil: PerfilMatch = {
        especialidades:  JSON.parse((peritoPerfil as { especialidades?: string }).especialidades  ?? '[]'),
        especialidades2: JSON.parse((peritoPerfil as { especialidades2?: string }).especialidades2 ?? '[]'),
        areaPrincipal:   (peritoPerfil as { areaPrincipal?: string | null }).areaPrincipal ?? null,
        tribunais:       JSON.parse((peritoPerfil as { tribunais?: string }).tribunais  ?? '[]'),
        estados:         JSON.parse((peritoPerfil as { estados?: string }).estados    ?? '[]'),
        cursos:          JSON.parse((peritoPerfil as { cursos?: string }).cursos     ?? '[]'),
        perfilCompleto:  (peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto ?? false,
      }
      scoreMatch = calcularScore(
        { numeroProcesso, tribunal: processoFields.tribunal, classe: processoFields.classe,
          assunto: processoFields.assunto, orgaoJulgador: processoFields.orgaoJulgador,
          dataDistribuicao: processoFields.dataDistribuicao, dataUltimaAtu: processoFields.dataUltimaAtu,
          partes: JSON.parse(processoFields.partes) as { nome: string; tipo: string }[] },
        perfil,
      )
    }

    // ── Cria Nomeacao ──────────────────────────────────────────────────────
    const nomeacao = await prisma.nomeacao.create({
      data: {
        peritoId:      userId,
        processoId:    processo.id,
        status:        'novo',
        scoreMatch,
        extractedData: JSON.stringify({ linkCitacao, citacaoId }),
      },
    })

    revalidatePath('/nomeacoes')
    return { ok: true, nomeacaoId: nomeacao.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao adicionar processo' }
  }
}

// ─── Action 2 — Buscar nomeações (triggered only by user click) ───────────────

export type BuscarResult =
  | { ok: true; novas: number; saldoRestante: number; totalEncontrados: number }
  | { ok: false; novas: 0; error: string }

export async function buscarNomeacoes(): Promise<BuscarResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, novas: 0, error: 'Não autenticado' }

  try {
    const config = await prisma.radarConfig.findUnique({ where: { peritoId: userId } })
    if (!config) return { ok: false, novas: 0, error: 'Radar não configurado' }

    const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
    const cpfPerfil = (peritoPerfil as { cpf?: string | null })?.cpf ?? null

    // Nome exato do cadastro (User.name — fonte mais confiável)
    const nomePeito = await getNomePeito(userId)
    if (!nomePeito) return { ok: false, novas: 0, error: 'Nome não cadastrado no perfil' }

    console.log(`[buscarNomeacoes] Buscando por: "${nomePeito}"`)

    // ── Check saldo before any paid endpoint ────────────────────────────────
    const saldoInfo = await radar.verificarSaldo()

    await prisma.radarConfig.update({
      where: { peritoId: userId },
      data: { saldoUltimaVerif: saldoInfo.saldo },
    })

    if (saldoInfo.saldo === 0) {
      return { ok: false, novas: 0, error: 'Saldo insuficiente na API Escavador' }
    }

    // Usa todos os tribunais configurados — não filtra mais por TJ*
    // (peritos podem atuar em TRF, TRT, etc.)
    const todasSiglas: string[] = JSON.parse(config.tribunaisMonitorados || '[]')
    if (todasSiglas.length === 0) {
      return { ok: false, novas: 0, error: 'Nenhum tribunal configurado no radar. Configure o radar primeiro.' }
    }
    // Mantém TJ* para o filtro pós-busca (mais restrito), mas passa todos para a query
    const siglasFiltro = todasSiglas // busca em todos os tribunais cadastrados

    console.log(`[buscarNomeacoes] Tribunais monitorados: ${siglasFiltro.join(', ')}`)

    const citacoes: CitacaoResult[] = []

    // ── FREE: aparições do monitoramento ────────────────────────────────────
    if (config.monitoramentoExtId) {
      try {
        const fromMonitor = await radar.buscarCitacoes(config.monitoramentoExtId)
        citacoes.push(...fromMonitor)
        console.log(`[buscarNomeacoes] Monitoramento: ${fromMonitor.length} aparições`)
      } catch {
        // Non-blocking
      }
    }

    // ── PAID: busca por nome completo nos diários cíveis ────────────────────
    const fromBusca = await radar.buscarPorNome(nomePeito, siglasFiltro)
    console.log(`[buscarNomeacoes] Busca por nome: ${fromBusca.length} resultados antes do filtro`)
    citacoes.push(...fromBusca)

    // ── PAID: busca por CPF (alguns diários listam CPF junto ao nome) ───────
    if (cpfPerfil && cpfPerfil.replace(/\D/g, '').length === 11) {
      try {
        const fromCpf = await radar.buscarPorNome(cpfPerfil, siglasFiltro)
        citacoes.push(...fromCpf)
      } catch {
        // Non-blocking
      }
    }

    // ── Dedup por externalId ─────────────────────────────────────────────────
    const seen = new Set<string>()
    const deduped = citacoes.filter((c) => {
      if (seen.has(c.externalId)) return false
      seen.add(c.externalId)
      return true
    })

    // ── Filtra: snippet deve mencionar perícia/perito E conter o nome do perito ─
    // Escavador retorna páginas inteiras do DJe — o snippet pode ser de outro
    // processo na mesma página. Exige nome no snippet para eliminar falsos positivos.
    const nomeLower = nomePeito.toLowerCase()
    const unique = deduped.filter((c) => {
      if (!isSnippetNomeacaoCivel(c.snippet)) return false
      return c.snippet.toLowerCase().includes(nomeLower)
    })

    console.log(`[buscarNomeacoes] Após filtro de snippet: ${unique.length} de ${deduped.length}`)

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
    return { ok: true, novas, saldoRestante: saldoPos.saldo, totalEncontrados: unique.length }
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
  varaNome?: string   // nome da vara/fórum do catálogo
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
        diarioNome: data.varaNome ?? data.diarioSigla,
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
