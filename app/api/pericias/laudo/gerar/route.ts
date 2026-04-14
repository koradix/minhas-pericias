import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { SYSTEM_PROMPT_LAUDO, detectarTipoLaudo, getContextoRegulatorio, REGRAS_QUESITOS } from '@/lib/ai/prompts-laudo'

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

  // Documentos do processo (baixados via Judit)
  documentosProcesso: {
    id: string
    nome: string
    tipo: string | null
  }[]
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface GerarLaudoOutput {
  secoes: {
    titulo: string
    conteudo: string
    fotosReferenciadas: number[]
    docsReferenciados: number[] // índices dos docs do processo usados nesta seção
  }[]
  qa: {
    campos_faltantes: string[]
    observacoes: string[]
  }
}

// System prompt: SYSTEM_PROMPT_LAUDO (lib/ai/prompts-laudo.ts)

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

  return `TIPO DE MODELO SELECIONADO: ${input.templateCategoria}

MODELO BASE (seções obrigatórias — seguir EXATAMENTE esta estrutura):
${secoesTemplate}

DADOS DO RESUMO (processo judicial):
- Número do processo: ${input.numeroProcesso}
- Tribunal: ${input.tribunal}
- Vara: ${input.vara}
- Autor: ${input.autor ?? '[não informado]'}
- Réu: ${input.reu ?? '[não informado]'}
- Tipo de ação: ${input.tipoAcao ?? '[não informado]'}
- Objeto da perícia: ${input.objetoPericia ?? '[não informado]'}
- Área técnica: ${input.areaTecnica ?? '[não informada]'}

PERITO RESPONSÁVEL:
- Nome: ${input.peritoNome}
- Qualificação: ${input.peritoQualificacao}

ANÁLISE DO PROCESSO (extraída por IA da nomeação):
${input.resumoProcesso ?? '[não disponível — preencher com [EDITAR PELO PERITO]]'}

QUESITOS DAS PARTES:
${input.quesitos.length > 0 ? input.quesitos.map((q, i) => `${i + 1}. ${q}`).join('\n') : '[nenhum quesito identificado até a presente data]'}

DADOS DA VISTORIA:

Fotos (${input.fotos.length} registros):
${fotosDescricao || '[nenhuma foto registrada — seção de fotos deve conter [COMPLEMENTAR]]'}

Transcrições de áudio da vistoria:
${transcricoesTexto || '[nenhuma transcrição disponível]'}

Observações e notas do perito:
${input.observacoesVistoria ?? '[nenhuma observação adicional]'}

DOCUMENTOS DO PROCESSO (${input.documentosProcesso?.length ?? 0} peças):
${(input.documentosProcesso ?? []).length > 0
  ? input.documentosProcesso.map((d, i) => `Doc ${i}: ${d.nome}${d.tipo ? ` (${d.tipo})` : ''}`).join('\n')
  : '[nenhum documento do processo disponível]'}

${getContextoRegulatorio(detectarTipoLaudo(input.templateCategoria))}

${REGRAS_QUESITOS}

Gere a PRIMEIRA VERSÃO do laudo seguindo todas as regras. Retorne APENAS o JSON.`
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
        max_tokens: 16000,
        system: SYSTEM_PROMPT_LAUDO,
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
