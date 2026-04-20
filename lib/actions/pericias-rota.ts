'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { TemplateVistoria } from '@/lib/constants/templates-vistoria'
import { geocodeAddress } from '@/lib/services/geocoding'

export interface CriarRotaResult {
  ok: boolean
  message: string
  rotaId?: string
  checkpointId?: string
}

export async function criarRotaDaPericia(
  periciaId: string,
  endereco: string,
): Promise<CriarRotaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const userId = session.user.id

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true, assunto: true },
    })
    if (!pericia || pericia.peritoId !== userId) {
      return { ok: false, message: 'Péricia não encontrada' }
    }

    const enderecoTrimmed = endereco.trim()
    if (!enderecoTrimmed) return { ok: false, message: 'Informe o endereço da vistoria' }

    // Geocode address — best effort, não bloqueia se falhar
    const geo = await geocodeAddress(enderecoTrimmed, { timeoutMs: 4000 })

    // Create a RotaPericia for this péricia
    const rota = await prisma.rotaPericia.create({
      data: {
        peritoId: userId,
        titulo: pericia.assunto,
        status: 'em_andamento',
        pericoId: periciaId,
      },
    })

    // Create the single checkpoint with the address and geocoded coords
    const checkpoint = await prisma.checkpoint.create({
      data: {
        rotaId: rota.id,
        periciaId,
        ordem: 1,
        titulo: 'Vistoria',
        endereco: enderecoTrimmed,
        lat: geo?.latitude ?? null,
        lng: geo?.longitude ?? null,
        status: 'pendente',
      },
    })

    // Update péricia status + coords (sobrescreve só se veio do geocoding)
    await prisma.pericia.update({
      where: { id: periciaId },
      data: {
        status: 'em_andamento',
        ...(geo ? { latitude: geo.latitude, longitude: geo.longitude } : {}),
      },
    })

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true, message: 'Rota criada.', rotaId: rota.id, checkpointId: checkpoint.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Mensagens amigáveis para erros comuns de infra
    if (msg.includes('503') || msg.toLowerCase().includes('unavailable')) {
      return { ok: false, message: 'Servidor lento. Aguarde alguns segundos e tente novamente.' }
    }
    if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('econnrefused')) {
      return { ok: false, message: 'Conexão lenta. Tente novamente.' }
    }
    return { ok: false, message: 'Erro ao criar vistoria. Tente novamente.' }
  }
}

// ─── Criar rota guiada a partir de template ───────────────────────────────────

export async function criarRotaGuiada(
  periciaId: string,
  endereco: string,
  template: TemplateVistoria,
): Promise<CriarRotaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const userId = session.user.id

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true, assunto: true },
    })
    if (!pericia || pericia.peritoId !== userId) {
      return { ok: false, message: 'Péricia não encontrada' }
    }

    const rota = await prisma.rotaPericia.create({
      data: {
        peritoId: userId,
        titulo: pericia.assunto,
        status: 'em_andamento',
        pericoId: periciaId,
      },
    })

    // Gera um checkpoint por item do template (exceto os repetíveis — 1 instância inicial)
    const checkpointData = template.itens.map((item, i) => ({
      rotaId:    rota.id,
      periciaId,
      ordem:     i + 1,
      titulo:    item.titulo,
      endereco:  i === 0 ? endereco.trim() : null,
      status:    'pendente',
    }))

    await prisma.checkpoint.createMany({ data: checkpointData })

    const primeiro = await prisma.checkpoint.findFirst({
      where: { rotaId: rota.id },
      orderBy: { ordem: 'asc' },
    })

    await prisma.pericia.update({
      where: { id: periciaId },
      data: { status: 'em_andamento' },
    })

    revalidatePath(`/pericias/${periciaId}`)
    return {
      ok: true,
      message: `Rota guiada criada com ${checkpointData.length} itens.`,
      rotaId: rota.id,
      checkpointId: primeiro?.id,
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao criar rota guiada' }
  }
}
