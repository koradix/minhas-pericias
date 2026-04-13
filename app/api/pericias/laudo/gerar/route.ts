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

// ─── System prompt movido para lib/ai/prompts-laudo.ts ──────────────────────
// SYSTEM_PROMPT_LAUDO é importado no topo do arquivo.
// O antigo SYSTEM_PROMPT inline foi removido.

const _LEGACY_PROMPT_REMOVED = `Removido — agora usa SYSTEM_PROMPT_LAUDO de lib/ai/prompts-laudo.ts.

OBJETIVO:
Gerar a PRIMEIRA VERSÃO de um laudo pericial com base no MODELO SELECIONADO, mantendo fielmente sua estrutura, linguagem e organização. O resultado será editado pelo perito no sistema e depois exportado em .DOCX.

REGRA #1 — O MODELO BASE É LEI:
- NÃO alterar a estrutura do template
- NÃO remover seções
- NÃO reordenar conteúdo
- NÃO simplificar linguagem jurídica
- Seguir EXATAMENTE a ordem e os títulos das seções fornecidas

REGRA #2 — PREENCHIMENTO INTELIGENTE:
- Preencher automaticamente tudo que for objetivo (dados do processo, partes, endereço, tribunal, vara, datas)
- Usar os dados do resumo do processo e da análise IA
- Integrar transcrições de áudio naturalmente no texto, na seção apropriada
- Integrar descrições e observações da vistoria

REGRA #3 — CAMPOS EDITÁVEIS (OBRIGATÓRIO):
Sempre que houver necessidade de validação humana ou dado ausente, inserir um dos marcadores:

[EDITAR PELO PERITO] Texto sugerido pela IA aqui...
[COMPLEMENTAR] Inserir análise técnica detalhada...
[VALIDAR DADO] Confirmar se a informação está correta conforme vistoria

Nunca deixar uma seção totalmente vazia. Sempre gerar pelo menos uma versão preliminar com marcador.

REGRA #4 — USO DAS FOTOS:
- Referenciar fotos pelo índice usando [FOTO_X] (ex: [FOTO_0], [FOTO_3])
- Gerar descrições técnicas preliminares baseadas na legenda/descrição da foto
- Na seção de Fotos, organizar por local/ambiente quando possível
- NÃO afirmar conclusões definitivas baseadas apenas em fotos
- Exemplo: "Observa-se nas imagens indícios de irregularidade na instalação, sendo necessária análise técnica mais aprofundada para confirmação."

REGRA #4b — USO DOS DOCUMENTOS DO PROCESSO:
- Referenciar documentos pelo índice usando [DOC_X] (ex: [DOC_0], [DOC_2])
- Citar o documento na seção onde ele é relevante (ex: "conforme petição inicial [DOC_0]")
- Na fundamentação, referenciar as peças processuais usadas como base
- Incluir docsReferenciados no JSON de cada seção com os índices dos docs citados

REGRA #5 — ANÁLISE TÉCNICA:
- Preencher parcialmente com base nos dados disponíveis
- Citar legislação pertinente quando a categoria indicar (CDC, normas ABNT, NRs, etc.)
- Deixar espaço para decisão técnica do perito com [COMPLEMENTAR]
- Nunca concluir algo sem base documental clara

REGRA #6 — QUESITOS:
- Responder cada quesito individualmente na seção correspondente
- Usar linguagem formal de laudo (ex: "Resposta:", seguida do texto)
- Quando a resposta depender de análise em campo, marcar [EDITAR PELO PERITO]
- Se não houver quesitos, indicar "Não foram formulados quesitos pelas partes até a presente data."

REGRA #7 — CONCLUSÃO:
- Gerar versão preliminar com ressalvas técnicas
- Numerar os pontos conclusivos
- Exemplo: "Com base nas informações levantadas, há indícios de [situação], sendo necessária validação técnica final pelo perito responsável."

REGRA #8 — FORMATAÇÃO (COMPATÍVEL COM .DOCX):
- Títulos claros numerados (1., 2., 3.)
- Parágrafos organizados e espaçados
- NÃO usar markdown (sem **, ##, -, etc.)
- NÃO usar símbolos especiais
- Texto limpo e formal, compatível com Word
- Preservar padrão jurídico formal

REGRA #9 — ENCERRAMENTO:
- Incluir texto padrão de encerramento com local para assinatura
- Formato: "Tendo concluído o presente laudo pericial em [X] folhas, coloca-se à disposição desse Juízo para dirimir qualquer dúvida. Nestes termos, pede deferimento. [EDITAR PELO PERITO] Local e data. [Nome do Perito] [Registro profissional]"

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto adicional:
{
  "secoes": [
    {
      "titulo": "Título exato da seção do template",
      "conteudo": "Texto completo da seção, formal, com [FOTO_X] e marcadores editáveis onde necessário",
      "fotosReferenciadas": [0, 3, 5],
      "docsReferenciados": [0, 1]
    }
  ],
  "qa": {
    "campos_faltantes": ["lista de dados que não foram fornecidos"],
    "observacoes": ["sugestões para o perito melhorar o laudo"]
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
