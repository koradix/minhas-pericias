'use server'

/**
 * Enriquecer nomeações com CNJ — ponte Escavador→Judit.
 *
 * O Escavador acha nomeações por nome no DJE mas não retorna CNJ.
 * A Judit busca por CPF e retorna todos os processos com CNJ.
 * Esta action cruza os dois: para cada nomeação sem CNJ, tenta
 * encontrar o processo correspondente na Judit.
 *
 * INDEPENDÊNCIA: funciona como step opcional. Se Judit estiver
 * desabilitada, as nomeações ficam sem CNJ (mas continuam visíveis).
 * Se Escavador estiver off, a Judit cria NomeacaoCitacao diretamente.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isJuditReady, juditLog } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import type { NormalizedLawsuit } from '@/lib/integrations/judit/types'

export interface EnriquecerResult {
  ok: boolean
  message: string
  enriquecidas: number
  total: number
}

/**
 * Cruza snippet da nomeação com processos da Judit.
 * Compara primeiro nome de cada parte com o texto do snippet.
 */
function encontrarProcesso(
  snippet: string,
  processos: NormalizedLawsuit[],
): NormalizedLawsuit | null {
  const snipLower = snippet.toLowerCase()

  for (const proc of processos) {
    // Pelo menos uma parte (não-advogado) deve aparecer no snippet
    const partesRelevantes = proc.partes.filter(p => {
      const tipo = p.tipo.toUpperCase()
      return !tipo.includes('ADVOGADO') && !tipo.includes('ADVOGADA')
    })

    for (const parte of partesRelevantes) {
      // Usa primeiro nome + último nome para match mais preciso
      const nomes = parte.nome.toLowerCase().split(/\s+/).filter(Boolean)
      if (nomes.length < 2) continue
      const primeiro = nomes[0]
      const ultimo = nomes[nomes.length - 1]
      if (primeiro.length < 3 || ultimo.length < 3) continue

      if (snipLower.includes(primeiro) && snipLower.includes(ultimo)) {
        return proc
      }
    }
  }
  return null
}

export async function enriquecerCitacoesComCnj(): Promise<EnriquecerResult> {
  const empty: EnriquecerResult = { ok: false, message: '', enriquecidas: 0, total: 0 }

  if (!isJuditReady()) {
    return { ...empty, ok: true, message: 'Judit desabilitada — nomeações mantidas sem CNJ' }
  }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Não autenticado' }
  const userId = session.user.id

  // Buscar CPF do perito
  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { cpf: true },
  })
  const cpf = perfil?.cpf?.replace(/\D/g, '') ?? ''
  if (cpf.length !== 11) {
    return { ...empty, ok: true, message: 'CPF não cadastrado — preencha no perfil para enriquecer nomeações' }
  }

  // Buscar nomeações sem CNJ
  const semCnj = await prisma.nomeacaoCitacao.findMany({
    where: { peritoId: userId, numeroProcesso: null },
    select: { id: true, snippet: true, diarioData: true },
  })

  if (semCnj.length === 0) {
    return { ok: true, message: 'Todas as nomeações já têm CNJ', enriquecidas: 0, total: 0 }
  }

  // Buscar processos na Judit por CPF
  juditLog(`[enriquecer] Buscando processos por CPF para enriquecer ${semCnj.length} nomeações`)
  const result = await judit.fetchProcessesByCpf(cpf)
  if (!result || result.normalized.length === 0) {
    return { ...empty, ok: true, message: 'Judit não encontrou processos para este CPF', total: semCnj.length }
  }

  juditLog(`[enriquecer] ${result.normalized.length} processos encontrados, cruzando...`)

  // Cruzar: para cada nomeação sem CNJ, encontrar o processo correspondente
  let enriquecidas = 0
  for (const cit of semCnj) {
    const match = encontrarProcesso(cit.snippet, result.normalized)
    if (match?.cnj) {
      await prisma.nomeacaoCitacao.update({
        where: { id: cit.id },
        data: { numeroProcesso: match.cnj },
      })
      enriquecidas++
      juditLog(`[enriquecer] ${match.cnj} → citação ${cit.id.slice(0, 8)}`)
    }
  }

  return {
    ok: true,
    message: `${enriquecidas} de ${semCnj.length} nomeações enriquecidas com CNJ`,
    enriquecidas,
    total: semCnj.length,
  }
}
