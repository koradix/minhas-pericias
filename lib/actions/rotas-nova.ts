'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { VARAS_CATALOG } from '@/lib/data/varas-catalog'
import type { VaraComEndereco } from '@/lib/services/escavador'

export interface SalvarRotaInput {
  titulo: string
  pontos: {
    titulo: string
    endereco: string
    latitude: number
    longitude: number
    ordem: number
  }[]
}

// ─── Action: Fetch varas by state (from local catalog — no external API) ──────

export async function fetchVarasByEstado(uf: string): Promise<VaraComEndereco[]> {
  if (!uf) return []
  return VARAS_CATALOG
    .filter((v) => v.uf === uf)
    .map((v) => ({
      varaId: v.id,
      varaNome: v.nome,
      tribunalSigla: v.tribunal,
      tribunalNome: v.tribunal,
      uf: v.uf,
      estado: v.uf,
      enderecoTexto: `${v.endereco} — ${v.cidade}`,
      latitude: v.latitude,
      longitude: v.longitude,
      dadosFicticios: false,
    }))
}

// ─── Action: Create rota from selected TribunalVara IDs ───────────────────────

export async function createRotaFromVaras(varaIds: string[]): Promise<{ ok: boolean; rotaId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  if (varaIds.length < 1) return { ok: false, error: 'Selecione ao menos 1 vara' }

  const varas = await prisma.tribunalVara.findMany({
    where: { id: { in: varaIds }, peritoId: session.user.id, ativa: true },
  })

  if (varas.length === 0) return { ok: false, error: 'Nenhuma vara encontrada' }

  const titulo = `Prospecção — ${varas.map((v) => v.tribunalSigla).filter((v, i, a) => a.indexOf(v) === i).join(', ')} · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  const rota = await prisma.rotaPericia.create({
    data: { peritoId: session.user.id, titulo, status: 'planejada' },
  })

  await prisma.checkpoint.createMany({
    data: varas.map((v, idx) => ({
      rotaId: rota.id,
      ordem: idx + 1,
      titulo: v.varaNome,
      endereco: v.enderecoTexto ?? '',
      lat: v.latitude ?? null,
      lng: v.longitude ?? null,
      status: 'pendente',
    })),
  })

  redirect('/rotas/pericias')
}

export async function salvarRotaProspeccao(input: SalvarRotaInput) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  if (!input.titulo.trim()) return { ok: false, error: 'Título obrigatório' }
  if (input.pontos.length < 1) return { ok: false, error: 'Selecione ao menos 1 parada' }

  try {
    const rota = await prisma.rotaPericia.create({
      data: {
        peritoId: session.user.id,
        titulo: input.titulo.trim(),
        status: 'planejada',
      },
      select: { id: true },
    })

    await prisma.checkpoint.createMany({
      data: input.pontos.map((p) => ({
        rotaId: rota.id,
        ordem: p.ordem,
        titulo: p.titulo,
        endereco: p.endereco,
        lat: p.latitude,
        lng: p.longitude,
        status: 'pendente',
      })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Erro ao salvar: ${msg.slice(0, 120)}` }
  }

  redirect('/rotas/pericias')
}

// ─── Action: Criar rota por comarca (agrupa varas dentro de cada comarca) ────

export interface ComarcaPonto {
  comarca: string
  endereco: string
  latitude: number
  longitude: number
  varas: { varaNome: string; juizNome?: string; secretarioNome?: string }[]
}

export async function salvarRotaComarcas(titulo: string, comarcas: ComarcaPonto[]) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  if (!titulo.trim()) return { ok: false, error: 'Título obrigatório' }
  if (comarcas.length < 1) return { ok: false, error: 'Selecione ao menos 1 comarca' }

  try {
    const rota = await prisma.rotaPericia.create({
      data: { peritoId: session.user.id, titulo: titulo.trim(), status: 'planejada' },
      select: { id: true },
    })

    await prisma.checkpoint.createMany({
      data: comarcas.map((c, idx) => ({
        rotaId: rota.id,
        ordem: idx + 1,
        titulo: c.comarca,
        endereco: c.endereco,
        lat: c.latitude,
        lng: c.longitude,
        comarca: c.comarca,
        status: 'pendente',
        varasJson: JSON.stringify(c.varas.map((v) => ({
          varaNome: v.varaNome,
          juizNome: v.juizNome ?? null,
          secretarioNome: v.secretarioNome ?? null,
          foiNomeado: false,
          visitada: false,
        }))),
      })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg.slice(0, 120) }
  }

  redirect('/rotas/pericias')
}

// ─── Action: Atualizar dados de visita do checkpoint ─────────────────────────

export interface VaraVisitaData {
  varaNome: string
  juizNome: string | null
  secretarioNome: string | null
  foiNomeado: boolean
  visitada: boolean
}

export async function atualizarCheckpointVisita(
  checkpointId: string,
  data: {
    juizNome?: string
    secretarioNome?: string
    foiNomeado?: boolean
    observacoes?: string
    varas?: VaraVisitaData[]
  }
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const cp = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { rotaId: true },
    })
    if (!cp) return { ok: false, error: 'Checkpoint não encontrado' }

    const rota = await prisma.rotaPericia.findUnique({
      where: { id: cp.rotaId, peritoId: session.user.id },
      select: { id: true },
    })
    if (!rota) return { ok: false, error: 'Rota não encontrada' }

    const juiz = data.juizNome ?? null
    const sec = data.secretarioNome ?? null
    const nomeado = data.foiNomeado ?? false
    const obs = data.observacoes ?? null
    const varasStr = data.varas ? JSON.stringify(data.varas) : null

    await prisma.$executeRaw`
      UPDATE "Checkpoint" SET
        "juizNome" = COALESCE(${juiz}, "juizNome"),
        "secretarioNome" = COALESCE(${sec}, "secretarioNome"),
        "foiNomeado" = ${nomeado},
        "observacoes" = COALESCE(${obs}, "observacoes"),
        "varasJson" = COALESCE(${varasStr}, "varasJson")
      WHERE id = ${checkpointId}
    `

    // Sincroniza dados com VaraContato para persistência cross-rota
    if (data.varas && cp) {
      for (const v of data.varas) {
        if (v.juizNome || v.secretarioNome) {
          await prisma.varaContato.upsert({
            where: {
              peritoId_tribunalSigla_varaNome: {
                peritoId: session.user.id,
                tribunalSigla: 'TJRJ', // TODO: tornar dinâmico
                varaNome: v.varaNome,
              },
            },
            create: {
              peritoId: session.user.id,
              tribunalSigla: 'TJRJ',
              varaNome: v.varaNome,
              juizNome: v.juizNome,
              secretarioNome: v.secretarioNome,
            },
            update: {
              ...(v.juizNome ? { juizNome: v.juizNome } : {}),
              ...(v.secretarioNome ? { secretarioNome: v.secretarioNome } : {}),
            },
          })
        }
      }
    }

    revalidatePath('/rotas/pericias')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg.slice(0, 120) }
  }
}

// ─── Action: Iniciar rota (planejada / em_andamento → em_execucao) ───────────

export async function iniciarRota(rotaId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.rotaPericia.update({
      where: { id: rotaId, peritoId: session.user.id },
      data: { status: 'em_execucao' },
      select: { id: true },
    })
    revalidatePath('/rotas/pericias')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao iniciar rota' }
  }
}

// ─── Action: Finalizar rota (em_execucao → concluida) ─────────────────────────

export async function finalizarRota(rotaId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.rotaPericia.update({
      where: { id: rotaId, peritoId: session.user.id },
      data: { status: 'concluida' },
      select: { id: true },
    })
    revalidatePath('/rotas/pericias')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao finalizar rota' }
  }
}

// ─── Action: Reabrir rota (concluida → em_execucao) ──────────────────────────

export async function reabrirRota(rotaId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.rotaPericia.update({
      where: { id: rotaId, peritoId: session.user.id },
      data: { status: 'em_execucao' },
      select: { id: true },
    })
    revalidatePath('/rotas/pericias')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao reabrir rota' }
  }
}
