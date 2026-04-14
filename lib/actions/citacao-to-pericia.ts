'use server'

import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
// Judit standby — enriquecerCitacoesComCnj removido do fluxo principal

interface ExtractedCitacao {
  assunto: string
  tipo: string
  vara: string | null
  processo: string | null
  partes: string | null
}

async function extrairDadosDaSnippet(snippet: string, diarioSigla: string): Promise<ExtractedCitacao> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Analise este trecho do Diário Oficial Judicial (${diarioSigla}) e extraia as informações sobre a nomeação de perito.

TRECHO:
${snippet}

Retorne um JSON com os campos abaixo. Se não encontrar a informação, use null.

{
  "assunto": "título curto e descritivo para a perícia (ex: 'Perícia de Engenharia Civil — Apuração de Danos', máx 80 chars)",
  "tipo": "tipo da perícia (ex: Engenharia Civil, Contabilidade, Medicina, Avaliação de Imóvel, etc.)",
  "vara": "nome da vara ou juízo (ex: '3ª Vara Cível de São Paulo')",
  "processo": "número do processo no formato CNJ (ex: '1234567-89.2024.8.26.0001') ou null",
  "partes": "nomes das partes principais separados por × (ex: 'João Silva × Banco XYZ') ou null"
}

Responda SOMENTE com o JSON, sem markdown.`

  try {
    const res = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '{}'
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const json = match ? match[1].trim() : raw
    const parsed = JSON.parse(json)
    return {
      assunto: parsed.assunto ?? 'Perícia judicial',
      tipo: parsed.tipo ?? 'Judicial',
      vara: parsed.vara ?? null,
      processo: parsed.processo ?? null,
      partes: parsed.partes ?? null,
    }
  } catch (err) {
    console.error('[extrairDadosDaSnippet] erro:', err)
    return { assunto: 'Perícia judicial', tipo: 'Judicial', vara: null, processo: null, partes: null }
  }
}

export async function criarPericiaDeCitacao(
  citacaoId: string,
): Promise<{ ok: true; periciaId: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const peritoId = session.user.id

  const citacao = await prisma.nomeacaoCitacao.findUnique({ where: { id: citacaoId } })
  if (!citacao || citacao.peritoId !== peritoId) {
    return { ok: false, error: 'Citação não encontrada' }
  }

  // Extract data from snippet using Claude
  const dados = await extrairDadosDaSnippet(citacao.snippet, citacao.diarioSigla)

  // Número sequencial: {Seq}-{Ano}-{UF}-{Cidade}-{Vara}
  const count = await prisma.pericia.count({ where: { peritoId } })
  const seq = String(count + 1).padStart(3, '0')
  const ano = new Date().getFullYear()
  const ufCode = citacao.diarioSigla?.replace(/^DJ/, 'TJ').replace('TJ', '').slice(0, 2) || 'XX'
  const varaClean = dados.vara
    ? dados.vara.split(' ').slice(0, 2).join('_').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9_]/g, '')
    : 'SEM'
  const numero = `${seq}-${ano}-${ufCode}-${varaClean}-CIV`

  // Extrair CNJ: 1) campo da citação, 2) Claude, 3) regex no snippet
  const isCnj = (s: string | null) => s && /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(s)
  let processoFinal: string | null = null
  if (isCnj(citacao.numeroProcesso)) processoFinal = citacao.numeroProcesso
  if (!processoFinal && isCnj(dados.processo)) processoFinal = dados.processo
  if (!processoFinal && citacao.snippet) {
    const cnjMatch = citacao.snippet.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
    if (cnjMatch) processoFinal = cnjMatch[0]
  }

  // Anti-duplicidade: se citação já tem perícia vinculada
  if (citacao.periciaId) {
    return { ok: true, periciaId: citacao.periciaId }
  }

  // Anti-duplicidade: se já existe perícia com mesmo CNJ
  if (processoFinal) {
    const existente = await prisma.pericia.findFirst({
      where: { peritoId, processo: processoFinal },
      select: { id: true },
    })
    if (existente) {
      await prisma.nomeacaoCitacao.update({
        where: { id: citacaoId },
        data: { visualizado: true, status: 'aceita', periciaId: existente.id },
      })
      return { ok: true, periciaId: existente.id }
    }
  }

  // Anti-duplicidade: se já existe perícia com mesmo réu (Escavador pode duplicar datas)
  if (dados.partes) {
    const reu = dados.partes.split('×')[1]?.trim()
    if (reu && reu.length > 5) {
      const existente = await prisma.pericia.findFirst({
        where: { peritoId, partes: { contains: reu } },
        select: { id: true },
      })
      if (existente) {
        await prisma.nomeacaoCitacao.update({
          where: { id: citacaoId },
          data: { visualizado: true, status: 'aceita', periciaId: existente.id },
        })
        return { ok: true, periciaId: existente.id }
      }
    }
  }

  const pericia = await prisma.pericia.create({
    data: {
      peritoId,
      numero,
      assunto: dados.assunto,
      tipo: dados.tipo,
      vara: dados.vara ?? undefined,
      processo: processoFinal ?? undefined,
      partes: dados.partes ?? undefined,
      status: 'planejada',
    },
  })

  // Mark as aceita and link to pericia
  await prisma.nomeacaoCitacao.update({
    where: { id: citacaoId },
    data: { visualizado: true, status: 'aceita', periciaId: pericia.id },
  })

  revalidatePath('/pericias')
  revalidatePath('/nomeacoes')

  return { ok: true, periciaId: pericia.id }
}

export async function rejeitarCitacao(
  citacaoId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const citacao = await prisma.nomeacaoCitacao.findUnique({ where: { id: citacaoId } })
  if (!citacao || citacao.peritoId !== session.user.id) {
    return { ok: false, error: 'Citação não encontrada' }
  }

  await prisma.nomeacaoCitacao.update({
    where: { id: citacaoId },
    data: { status: 'rejeitada', visualizado: true },
  })

  revalidatePath('/nomeacoes')
  return { ok: true }
}
