'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorError, type CitacaoResult } from '@/lib/services/radar-provider'

export interface NomeacaoCard {
  id: string
  titulo: string
  tribunal: string
  data: string
  snippet: string
  numeroProcesso: string | null
  link: string
}

export interface BuscarDiretoResult {
  ok: boolean
  resultados: NomeacaoCard[]
  error?: string
}

export async function buscarNomeacoesDireto(): Promise<BuscarDiretoResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, resultados: [], error: 'Não autenticado' }

  const perfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
  if (!perfil) return { ok: false, resultados: [], error: 'Perfil não encontrado. Complete seu cadastro.' }

  const nome = session.user?.name ?? ''
  if (!nome.trim()) return { ok: false, resultados: [], error: 'Nome do usuário não encontrado no perfil.' }

  const cpf = (perfil as { cpf?: string | null }).cpf ?? null
  const siglas: string[] = JSON.parse(perfil.tribunais || '[]')

  const umMesAtras = new Date()
  umMesAtras.setDate(umMesAtras.getDate() - 30)

  // Build search terms: name (always) + CPF (if available)
  const termos: string[] = [nome]
  if (cpf && cpf.replace(/\D/g, '').length === 11) {
    termos.push(cpf)
  }

  try {
    const todas: CitacaoResult[] = []
    for (const termo of termos) {
      // Paginar até 3 páginas (150 resultados) para não perder nomeações recentes
      for (let page = 1; page <= 3; page++) {
        try {
          const res = await radar.buscarPorNome(termo, siglas, page)
          todas.push(...res)
          if (res.length < 50) break // última página
        } catch {
          break
        }
      }
    }

    // Dedup by externalId
    const seen = new Set<string>()
    const unicas = todas.filter((c) => {
      if (seen.has(c.externalId)) return false
      seen.add(c.externalId)
      return true
    })

    // Filter to last 60 days (ampliado para não perder nomeações recentes)
    const sessentaDiasAtras = new Date()
    sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60)
    const recentes = unicas.filter((c) => new Date(c.diarioData) >= sessentaDiasAtras)

    const resultados: NomeacaoCard[] = recentes.map((c) => ({
      id: c.externalId,
      titulo: c.numeroProcesso ? `Processo ${c.numeroProcesso}` : 'Nomeação encontrada',
      tribunal: c.diarioNome || c.diarioSigla,
      data: c.diarioData,
      snippet: c.snippet,
      numeroProcesso: c.numeroProcesso,
      link: c.linkCitacao,
    }))

    return { ok: true, resultados }
  } catch (e) {
    if (e instanceof EscavadorError) {
      if (e.code === 402) return { ok: false, resultados: [], error: 'Saldo insuficiente na API Escavador' }
      if (e.code === 401) return { ok: false, resultados: [], error: 'Token de API inválido' }
    }
    return { ok: false, resultados: [], error: 'Erro ao buscar nomeações. Tente novamente.' }
  }
}
