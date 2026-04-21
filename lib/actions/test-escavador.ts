'use server'

/**
 * TEMPORÁRIO — página de teste /testeapi
 * Chama EscavadorService.buscarProcessosEnvolvido e retorna tudo bruto
 * para inspeção. Não persiste nada no banco.
 */

import { auth } from '@/auth'
import { EscavadorService } from '@/lib/services/escavador'
import { EscavadorError } from '@/lib/services/radar-provider'

export interface TestEscavadorResult {
  ok: boolean
  error?: string

  // Saldo antes/depois
  saldoAntes?: number
  saldoDepois?: number

  // Dados brutos da resposta v2
  rawResponse?: unknown

  // Processamento pelo service
  totalProcessos?: number
  totalPages?: number
  citacoesCount?: number
  citacoes?: unknown[]

  // Timing
  durationMs?: number
}

export async function testBuscarProcessosEnvolvido(
  nome: string,
  cpf: string,
): Promise<TestEscavadorResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const nomeTrim = nome.trim()
  if (!nomeTrim) return { ok: false, error: 'Nome é obrigatório' }

  const cpfDigits = cpf.replace(/\D/g, '')
  const cpfParam = cpfDigits.length === 11 ? cpfDigits : null

  const svc = new EscavadorService()
  const t0 = Date.now()

  try {
    // Saldo antes
    const saldoAntes = await svc.verificarSaldo()

    // Chamada v2 via service (passa pela mesma lógica das nomeações)
    const { citacoes, totalProcessos, totalPages } = await svc.buscarProcessosEnvolvido(
      nomeTrim,
      cpfParam,
      1,
    )

    // Também faz chamada crua (axios-like) para ver o JSON bruto da API
    const token = process.env.ESCAVADOR_API_TOKEN
    const params = new URLSearchParams()
    params.set('nome', nomeTrim)
    if (cpfParam) params.set('cpf', cpfParam)
    params.set('limit', '50')

    let rawResponse: unknown = null
    try {
      const res = await fetch(`https://api.escavador.com/api/v2/envolvido/processos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })
      rawResponse = await res.json()
    } catch (e) {
      rawResponse = { error: e instanceof Error ? e.message : String(e) }
    }

    // Saldo depois
    const saldoDepois = await svc.verificarSaldo()

    return {
      ok: true,
      saldoAntes: saldoAntes.saldo,
      saldoDepois: saldoDepois.saldo,
      rawResponse,
      totalProcessos,
      totalPages,
      citacoesCount: citacoes.length,
      citacoes,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return {
        ok: false,
        error: `EscavadorError ${err.code}: ${err.message}`,
        durationMs: Date.now() - t0,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── Só saldo (rápido, grátis) ────────────────────────────────────────────────

export async function testVerificarSaldo(): Promise<{ ok: boolean; saldo?: number; descricao?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const svc = new EscavadorService()
    const info = await svc.verificarSaldo()
    return { ok: true, saldo: info.saldo, descricao: info.descricao }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return { ok: false, error: `EscavadorError ${err.code}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
