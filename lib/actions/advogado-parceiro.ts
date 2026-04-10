'use server'

import { auth } from '@/auth'

/**
 * Solicita download de autos de um processo via Escavador.
 * Usa credenciais do advogado parceiro configuradas em variáveis de ambiente:
 *   TRIBUNAL_LOGIN    — nº OAB (ex: "222528")
 *   TRIBUNAL_SENHA    — senha do e-SAJ/PJe
 *
 * Se não configuradas, tenta via documentos públicos (sem autenticação).
 */
export async function solicitarDownloadAutos(
  cnj: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autenticado' }

  try {
    const { EscavadorService } = await import('@/lib/services/escavador')
    const escavador = new EscavadorService()

    const login = process.env.TRIBUNAL_LOGIN
    const senha = process.env.TRIBUNAL_SENHA

    if (login && senha) {
      // Com credenciais do advogado → autos restritos
      const res = await escavador.solicitarAtualizacaoV2(cnj, {
        autos: true,
        usuario: login,
        senha,
      })
      return {
        ok: res.ok,
        message: res.ok
          ? 'Download solicitado com credenciais do advogado. Autos disponíveis em alguns minutos.'
          : res.message ?? 'Erro ao solicitar autos',
      }
    } else {
      // Sem credenciais → apenas documentos públicos
      const res = await escavador.solicitarAtualizacaoV2(cnj, {
        documentos_publicos: true,
      })
      return {
        ok: res.ok,
        message: res.ok
          ? 'Download de documentos públicos solicitado. Disponíveis em alguns minutos.'
          : res.message ?? 'Erro ao solicitar documentos',
      }
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message.slice(0, 150) : 'Erro desconhecido' }
  }
}
