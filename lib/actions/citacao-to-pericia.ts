'use server'

import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ExtractedCitacao {
  assunto: string
  tipo: string
  vara: string | null
  processo: string | null
  partes: string | null
  endereco: string | null
}

async function extrairDadosDaSnippet(snippet: string, diarioSigla: string): Promise<ExtractedCitacao> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Analise este trecho do Diário Oficial Judicial (${diarioSigla}) e extraia TODAS as informações disponíveis sobre a nomeação de perito.

TRECHO:
${snippet}

INSTRUÇÕES:
- Procure nomes de pessoas mencionadas como partes (autora/autor, ré/réu, requerente, requerido)
- Se o texto menciona "pela autora" ou "requerida pela autora", tente inferir o tipo de ação
- Se menciona "Comarca" ou vara, extraia
- O número do processo pode estar em formato CNJ ou como "autos n." / "processo n."
- Se não encontrar, use null — NUNCA invente

{
  "assunto": "título curto para a perícia baseado no contexto (ex: 'Perícia Elétrica — Aferição de Medidor'), máx 80 chars",
  "tipo": "tipo da perícia (ex: Engenharia Elétrica, Saneamento, Avaliação de Imóvel)",
  "vara": "nome da vara ou comarca mencionada no texto (ex: '2ª Vara Cível de São João de Meriti'), ou null",
  "processo": "número do processo no formato CNJ se encontrado, ou null",
  "partes": "nomes das partes separados por × (ex: 'Maria Silva × ENEL BRASIL S.A'), ou null",
  "endereco": "endereço do imóvel/local da perícia, ou null"
}

Retorne SOMENTE o JSON, sem markdown.`

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
      endereco: parsed.endereco ?? null,
    }
  } catch (err) {
    console.error('[extrairDadosDaSnippet] erro:', err)
    return { assunto: 'Perícia judicial', tipo: 'Judicial', vara: null, processo: null, partes: null, endereco: null }
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

  // UF do diário
  const ufCode = citacao.diarioSigla?.replace(/^DJ/, '').replace(/^TJ/, '').slice(0, 2).toUpperCase() || 'XX'

  // Extract data — Claude com fallback regex
  let dados = await extrairDadosDaSnippet(citacao.snippet, citacao.diarioSigla)

  // ─── Fallback: extrair do snippet ──────────────────────────────────────
  const s = citacao.snippet ?? ''

  // v2 snippet format: "Perito no processo CNJ | Vara | Autor × Réu"
  if (!dados.partes) {
    const pipePartes = s.split('|').pop()?.trim()
    if (pipePartes && pipePartes.includes('×')) {
      dados = { ...dados, partes: pipePartes }
    }
  }

  // CNJ do snippet v2
  if (!dados.processo) {
    const cnjInSnippet = s.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
    if (cnjInSnippet) dados = { ...dados, processo: cnjInSnippet[0] }
  }

  // Vara do snippet v2: "| Vara Cível de X |"
  if (!dados.vara) {
    const pipes = s.split('|').map(p => p.trim()).filter(Boolean)
    if (pipes.length >= 2) {
      const varaCandidate = pipes[1] // segundo segmento geralmente é a vara
      if (varaCandidate && !varaCandidate.includes('×') && varaCandidate.length > 3) {
        dados = { ...dados, vara: varaCandidate }
      }
    }
  }

  // Fallback partes: AUTOR/RÉU explícito
  if (!dados.partes) {
    const autorMatch = s.match(/AUTOR[A]?:\s*([^×\n,]+)/i)
    const reuMatch = s.match(/R[ÉE]U:\s*([^×\n,]+)/i)
    if (autorMatch || reuMatch) {
      dados = { ...dados, partes: [autorMatch?.[1]?.trim(), reuMatch?.[1]?.trim()].filter(Boolean).join(' × ') }
    }
  }

  // Fallback partes: "Partes: XXX × YYY"
  if (!dados.partes) {
    const partesMatch = s.match(/Partes:\s*([^—\n]+)/i)
    if (partesMatch) dados = { ...dados, partes: partesMatch[1].trim() }
  }

  // Vara: buscar no banco VaraPublica pela UF
  if (!dados.vara) {
    // Tentar encontrar comarca no snippet
    const comarcaMatch = s.match(/(?:Comarca|comarca)\s+(?:de\s+|da\s+)?([^,.\n]+)/i)
    if (comarcaMatch) {
      const comarcaNome = comarcaMatch[1].trim().toUpperCase()
      // Buscar no banco
      const varaDB = await prisma.varaPublica.findFirst({
        where: { uf: ufCode, comarca: { contains: comarcaNome } },
        select: { varaNome: true, comarca: true },
      })
      if (varaDB) {
        dados = { ...dados, vara: `${varaDB.varaNome} — ${varaDB.comarca}` }
      } else {
        dados = { ...dados, vara: `Vara Cível — ${comarcaMatch[1].trim()}` }
      }
    }
  }

  // ─── Gerar ID: {Seq}-{Ano}-{UF}-{Cidade}-{NºVara}{Tipo} ──────────────
  const count = await prisma.pericia.count({ where: { peritoId } })
  const seq = String(count + 1).padStart(3, '0')
  const ano = citacao.diarioData ? citacao.diarioData.getFullYear() : new Date().getFullYear()
  // Cidade: extrair da vara (ex: "3ª Vara Cível de Cabo Frio" → CABO_FRIO)
  const cidadeMatch = dados.vara?.match(/(?:de|da|do)\s+(.+?)$/i)
  const cidade = cidadeMatch
    ? cidadeMatch[1].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 15)
    : 'SEM'
  // Número da vara: "3ª Vara Cível" → 3
  const varaNumMatch = dados.vara?.match(/^(\d+)[ªº]?\s/i)
  const varaNum = varaNumMatch ? varaNumMatch[1] : ''
  const varaTipo = dados.vara?.toLowerCase().includes('famil') ? 'FAM'
    : dados.vara?.toLowerCase().includes('fazenda') ? 'FAZ'
    : dados.vara?.toLowerCase().includes('única') ? 'VU'
    : 'CIV'
  const numero = `${seq}-${ano}-${ufCode}-${cidade}-${varaNum}${varaTipo}`

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

  // Formatar partes como "AUTOR: xxx × RÉU: yyy"
  let partesFormatadas = dados.partes ?? null
  if (partesFormatadas && !partesFormatadas.includes('AUTOR:')) {
    const parts = partesFormatadas.split('×').map(p => p.trim())
    if (parts.length >= 2) {
      partesFormatadas = `AUTOR: ${parts[0]} × RÉU: ${parts[1]}`
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
      partes: partesFormatadas ?? undefined,
      endereco: dados.endereco ?? undefined,
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
