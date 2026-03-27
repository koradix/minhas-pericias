'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ai } from '@/lib/ai'

// ─── Criar intake ao fazer upload ────────────────────────────────────────────

export async function criarProcessoIntake(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autorizado')

  const file = formData.get('arquivo') as File | null
  if (!file || file.size === 0) throw new Error('Selecione um arquivo para enviar')

  const intake = await prisma.processoIntake.create({
    data: {
      peritoId:     session.user.id,
      nomeArquivo:  file.name,
      tamanhoBytes: file.size,
      mimeType:     file.type || null,
      status:       'upload_feito',
    },
  })

  redirect(`/processos/${intake.id}`)
}

// ─── Tipos de retorno das ações de IA ────────────────────────────────────────

export interface AIActionResult {
  ok: boolean
  message: string
  periciaId?: string
  periciaNumero?: string
}

// ─── Extrair dados ───────────────────────────────────────────────────────────

export async function extrairDadosIA(intakeId: string): Promise<AIActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const intake = await prisma.processoIntake.findUnique({
    where: { id: intakeId },
    select: { id: true, peritoId: true, nomeArquivo: true },
  }).catch(() => null)

  if (!intake || intake.peritoId !== session.user.id)
    return { ok: false, message: 'Intake não encontrado' }

  try {
    const dados = await ai.extractProcessData({
      textoOuNomeArquivo: intake.nomeArquivo,
      intakeId,
    })

    await prisma.processoIntake.update({
      where: { id: intakeId },
      data: {
        dadosExtraidos: JSON.stringify(dados),
        status: 'extracao_pronta',
      },
    })

    revalidatePath(`/processos/${intakeId}`)
    return { ok: true, message: 'Dados extraídos com sucesso.' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { ok: false, message: `Falha ao extrair dados: ${msg}` }
  }
}

// ─── Gerar resumo ────────────────────────────────────────────────────────────

export async function gerarResumoIA(intakeId: string): Promise<AIActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const intake = await prisma.processoIntake.findUnique({
    where: { id: intakeId },
    select: { id: true, peritoId: true, dadosExtraidos: true },
  }).catch(() => null)

  if (!intake || intake.peritoId !== session.user.id)
    return { ok: false, message: 'Intake não encontrado' }

  if (!intake.dadosExtraidos)
    return { ok: false, message: 'Execute "Extrair dados" primeiro para gerar o resumo.' }

  try {
    const dadosExtraidos = JSON.parse(intake.dadosExtraidos)
    const resumoObj = await ai.generateProcessSummary({ dadosExtraidos })

    // Store as structured JSON so the UI can render + edit each section
    await prisma.processoIntake.update({
      where: { id: intakeId },
      data: {
        resumo: JSON.stringify(resumoObj),
        status: 'resumo_pronto',
      },
    })

    revalidatePath(`/processos/${intakeId}`)
    return { ok: true, message: 'Resumo gerado com sucesso.' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { ok: false, message: `Falha ao gerar resumo: ${msg}` }
  }
}

// ─── Salvar resumo editado manualmente ───────────────────────────────────────

export interface ResumoData {
  resumoCurto: string
  objetoDaPericia: string
  pontosRelevantes: string[]
  necessidadesDeCampo: string[]
}

export async function salvarResumoEditado(
  intakeId: string,
  data: ResumoData,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  try {
    const existing = await prisma.processoIntake.findUnique({
      where: { id: intakeId },
      select: { peritoId: true },
    })
    if (!existing || existing.peritoId !== session.user.id)
      return { ok: false, message: 'Intake não encontrado' }

    await prisma.processoIntake.update({
      where: { id: intakeId },
      data: { resumo: JSON.stringify(data) },
    })

    revalidatePath(`/processos/${intakeId}`)
    return { ok: true, message: 'Resumo salvo.' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { ok: false, message: `Erro ao salvar: ${msg}` }
  }
}

// ─── Criar card da perícia ───────────────────────────────────────────────────

export async function criarCardPericiaIA(intakeId: string): Promise<AIActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const intake = await prisma.processoIntake.findUnique({
    where: { id: intakeId },
    select: { id: true, peritoId: true, dadosExtraidos: true, periciaId: true },
  }).catch(() => null)

  if (!intake || intake.peritoId !== session.user.id)
    return { ok: false, message: 'Intake não encontrado' }

  if (intake.periciaId)
    return { ok: true, message: 'Card da perícia já criado.', periciaId: intake.periciaId }

  if (!intake.dadosExtraidos)
    return { ok: false, message: 'Execute "Extrair dados" primeiro antes de criar o card.' }

  try {
    const dadosExtraidos = JSON.parse(intake.dadosExtraidos)
    const card = await ai.createPericiaCardFromProcess({
      dadosExtraidos,
      peritoId: session.user.id,
      intakeId,
    })

    // Gera número sequencial para a perícia
    const count = await prisma.pericia.count({ where: { peritoId: session.user.id } })
    const ano = new Date().getFullYear()
    const numero = `PRC-${ano}-${String(count + 1).padStart(3, '0')}`

    const pericia = await prisma.pericia.create({
      data: {
        peritoId:  session.user.id,
        numero,
        assunto:   card.titulo,
        tipo:      card.tipoPericia,
        // Enrich with all fields extracted by AI
        vara:      dadosExtraidos.vara ?? null,
        processo:  dadosExtraidos.numeroProcesso ?? null,
        partes:    [dadosExtraidos.autor, dadosExtraidos.reu].filter(Boolean).join(' × ') || null,
        endereco:  card.endereco ?? null,
        prazo:     card.prazo ?? null,
        // Status marks this as coming from a process import (not a manual entry)
        status:    'processo_importado',
      },
    })

    await prisma.processoIntake.update({
      where: { id: intakeId },
      data: {
        periciaId: pericia.id,
        status: 'card_criado',
      },
    })

    revalidatePath(`/processos/${intakeId}`)
    revalidatePath('/pericias')
    return {
      ok:            true,
      message:       `Perícia ${numero} criada com sucesso.`,
      periciaId:     pericia.id,
      periciaNumero: numero,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { ok: false, message: `Falha ao criar card: ${msg}` }
  }
}

// ─── Deletar intake ───────────────────────────────────────────────────────────

export async function deletarProcessoIntake(intakeId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autorizado')

  await prisma.processoIntake.deleteMany({
    where: { id: intakeId, peritoId: session.user.id },
  })

  revalidatePath('/processos')
  redirect('/processos')
}
