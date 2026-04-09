import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 120

// ─── Input ────────────────────────────────────────────────────────────────────

export interface GerarLaudoInput {
  // Processo
  numeroProcesso: string
  tribunal: string
  vara: string
  autor: string | null
  reu: string | null
  tipoAcao: string | null
  objetoPericia: string | null
  quesitos: string[]

  // Perito
  peritoNome: string
  peritoQualificacao: string

  // Análise IA anterior (do upload da nomeação)
  resumoProcesso: string | null
  areaTecnica: string | null

  // Template selecionado
  templateCategoria: string
  templateSecoes: { titulo: string; placeholder: string }[]

  // Vistoria — fotos com metadados
  fotos: {
    url: string | null
    descricao: string | null
    local: string | null
    tipo: string // foto | nota
    texto: string | null // nota de texto ou transcrição de áudio
  }[]

  // Áudios transcritos
  transcricoes: {
    descricao: string | null
    texto: string // texto transcrito
  }[]

  // Observações gerais da vistoria
  observacoesVistoria: string | null
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface GerarLaudoOutput {
  secoes: {
    titulo: string
    conteudo: string
    fotosReferenciadas: number[] // índices das fotos usadas nesta seção
  }[]
  qa: {
    campos_faltantes: string[]
    observacoes: string[]
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente especializado em redigir LAUDOS PERICIAIS judiciais no Brasil.

Sua função é gerar um rascunho estruturado de laudo pericial com base nos dados fornecidos.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS JSON válido, sem markdown, sem texto adicional.
2. Tom: formal, técnico, objetivo. Linguagem de laudo judicial.
3. Cada seção do template deve ser preenchida com conteúdo relevante.
4. FOTOS: referencie fotos pelo índice no array (0-based). Indique onde cada foto deve ser inserida no texto usando [FOTO_X] (ex: [FOTO_0], [FOTO_3]). A plataforma substituirá pela imagem real.
5. TRANSCRIÇÕES: integre o conteúdo das transcrições de áudio naturalmente no texto, na seção apropriada.
6. QUESITOS: se houver quesitos das partes, responda cada um individualmente na seção correspondente.
7. Mantenha espaços marcados com [EDITAR: descrição] para trechos que o perito deve completar manualmente (medições específicas, valores exatos, datas, etc.).
8. Não invente dados. Se informação não foi fornecida, marque [EDITAR: informação necessária].
9. Na seção de vistoria, organize as fotos por local/ambiente quando possível.
10. Conclusão deve ser fundamentada nas evidências apresentadas, sem ser categórica em pontos que dependam de análise adicional.

ESTRUTURA DE SAÍDA:
{
  "secoes": [
    {
      "titulo": "Nome da seção",
      "conteudo": "Texto da seção com [FOTO_X] e [EDITAR: ...] onde aplicável",
      "fotosReferenciadas": [0, 3, 5]
    }
  ],
  "qa": {
    "campos_faltantes": ["lista de dados que faltaram"],
    "observacoes": ["sugestões para melhorar o laudo"]
  }
}`

function buildUserPrompt(input: GerarLaudoInput): string {
  const fotosDescricao = input.fotos.map((f, i) => {
    const parts = [`Foto ${i}:`]
    if (f.descricao) parts.push(`Descrição: ${f.descricao}`)
    if (f.local) parts.push(`Local: ${f.local}`)
    if (f.tipo === 'nota' && f.texto) parts.push(`Nota: ${f.texto}`)
    return parts.join(' | ')
  }).join('\n')

  const transcricoesTexto = input.transcricoes.map((t, i) => {
    return `Transcrição ${i}: ${t.descricao ?? 'Áudio da vistoria'}\n${t.texto}`
  }).join('\n\n')

  const secoesTemplate = input.templateSecoes.map((s) =>
    `- ${s.titulo}: ${s.placeholder}`
  ).join('\n')

  return `Gere o rascunho do laudo pericial seguindo EXATAMENTE as seções do template abaixo.

TEMPLATE DE LAUDO (categoria: ${input.templateCategoria}):
${secoesTemplate}

DADOS DO PROCESSO:
- Número: ${input.numeroProcesso}
- Tribunal: ${input.tribunal}
- Vara: ${input.vara}
- Autor: ${input.autor ?? '[não informado]'}
- Réu: ${input.reu ?? '[não informado]'}
- Tipo de ação: ${input.tipoAcao ?? '[não informado]'}
- Objeto da perícia: ${input.objetoPericia ?? '[não informado]'}

PERITO:
- Nome: ${input.peritoNome}
- Qualificação: ${input.peritoQualificacao}

RESUMO DO PROCESSO (extraído por IA):
${input.resumoProcesso ?? '[não disponível]'}

ÁREA TÉCNICA: ${input.areaTecnica ?? '[não informada]'}

QUESITOS DAS PARTES:
${input.quesitos.length > 0 ? input.quesitos.map((q, i) => `${i + 1}. ${q}`).join('\n') : '[nenhum quesito identificado]'}

FOTOS DA VISTORIA (${input.fotos.length} registros):
${fotosDescricao || '[nenhuma foto registrada]'}

TRANSCRIÇÕES DE ÁUDIO:
${transcricoesTexto || '[nenhuma transcrição disponível]'}

OBSERVAÇÕES DA VISTORIA:
${input.observacoesVistoria ?? '[nenhuma observação adicional]'}

Retorne o JSON seguindo o schema de saída definido.`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateOutput(o: unknown): o is GerarLaudoOutput {
  if (typeof o !== 'object' || o === null) return false
  const r = o as Record<string, unknown>
  return Array.isArray(r.secoes)
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })

  let input: GerarLaudoInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(input) }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[laudo/gerar] API error:', res.status, errBody.slice(0, 200))
      return NextResponse.json({ ok: false, error: `API error: ${res.status}` }, { status: 502 })
    }

    const body = await res.json()
    const rawText: string = body?.content?.[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ ok: false, error: 'Resposta da IA não contém JSON válido' }, { status: 502 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (!validateOutput(parsed)) {
      return NextResponse.json({ ok: false, error: 'Estrutura de resposta inválida' }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      output: parsed,
      model: body?.model ?? 'claude-sonnet-4-20250514',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[laudo/gerar]', msg)
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 500 })
  }
}
