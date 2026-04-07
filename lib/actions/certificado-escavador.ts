'use server'

import { auth } from '@/auth'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'

export type CertificadoInfo = {
  id: number
  titular: string
  cpf: string
  validade: string | null
}

export async function listarCertificados(): Promise<CertificadoInfo[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const escavador = radar as EscavadorService
  return escavador.listarCertificados()
}

export async function uploadCertificado(
  formData: FormData,
): Promise<{ ok: true; titular: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const file = formData.get('certificado') as File | null
  const senha = formData.get('senha') as string | null

  if (!file || !senha) return { ok: false, error: 'Arquivo e senha são obrigatórios' }
  if (!file.name.match(/\.(pfx|p12)$/i)) return { ok: false, error: 'Formato inválido — envie um arquivo .pfx ou .p12' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Arquivo muito grande (máx 5 MB)' }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const escavador = radar as EscavadorService
    const res = await escavador.uploadCertificado(buffer, file.name, senha)
    if (!res.ok) return { ok: false, error: res.message }
    return { ok: true, titular: res.titular }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao enviar certificado' }
  }
}

export async function removerCertificado(
  id: number,
): Promise<{ ok: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }
  const escavador = radar as EscavadorService
  const ok = await escavador.removerCertificado(id)
  return { ok }
}
