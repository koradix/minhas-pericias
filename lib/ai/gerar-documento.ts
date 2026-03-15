import type { Pericia } from '@/lib/mocks/pericias'

export interface ParamsGerarDoc {
  tipo: string
  nomeModelo: string
  pericia: Pericia
  instrucao?: string
}

// ─── Prompts por tipo ─────────────────────────────────────────────────────────

function promptPropostaHonorarios(p: Pericia, instrucao: string): string {
  return `Você é um perito judicial experiente no estado do Rio de Janeiro, Brasil.

Gere uma proposta de honorários periciais profissional e completa com os dados abaixo.

DADOS DO PROCESSO:
- Número: ${p.processo}
- Vara: ${p.vara}
- Autor/Requerente: ${p.cliente}
- Assunto da Perícia: ${p.assunto}
- Referência Interna: ${p.numero}
- Valor Sugerido: ${p.valor}

INSTRUÇÃO DO PERITO: ${instrucao || 'Gerar proposta padrão profissional.'}

FORMATO REQUERIDO:
Gere a proposta em texto corrido, estruturada com as seguintes seções numeradas:

1. IDENTIFICAÇÃO E QUALIFICAÇÃO DO PERITO
2. OBJETO DA PERÍCIA
3. ESCOPO DOS TRABALHOS PERICIAIS
4. METODOLOGIA ADOTADA
5. CRONOGRAMA E PRAZO DE ENTREGA
6. HONORÁRIOS PERICIAIS E FORMA DE PAGAMENTO
7. OBSERVAÇÕES E CONDIÇÕES GERAIS
8. ASSINATURA

Regras:
- Linguagem: formal, técnica e profissional, adequada ao padrão TJRJ
- Não inventar dados que não foram fornecidos
- Usar [PREENCHER] para campos que dependem de informações que o perito precisa fornecer
- Incluir referência ao processo número fornecido e à vara competente
- Para honorários, usar o valor sugerido (${p.valor}) como base
- Término com local, data e espaço para assinatura`
}

function promptLaudo(p: Pericia, nomeModelo: string, instrucao: string): string {
  return `Você é um perito judicial experiente no estado do Rio de Janeiro, Brasil.

Gere a estrutura inicial de um laudo pericial técnico e profissional com os dados abaixo.

DADOS DO PROCESSO:
- Número: ${p.processo}
- Vara: ${p.vara}
- Autor/Requerente: ${p.cliente}
- Assunto: ${p.assunto}
- Referência Interna: ${p.numero}
- Modelo de referência: ${nomeModelo}

INSTRUÇÃO DO PERITO: ${instrucao || 'Gerar estrutura padrão de laudo pericial.'}

FORMATO REQUERIDO:
Gere o laudo em texto corrido, estruturado com as seguintes seções em algarismos romanos:

I. OBJETO DA PERÍCIA
II. SÍNTESE DOS FATOS
III. DILIGÊNCIAS REALIZADAS
IV. ANÁLISE TÉCNICA
V. QUESITOS DO JUÍZO
VI. QUESITOS DAS PARTES
VII. CONCLUSÃO
VIII. ENCERRAMENTO

Regras:
- Linguagem: formal, técnica e objetiva, adequada ao padrão TJRJ/TRT-1/JFRJ
- Nas seções que dependem de vistoria de campo, usar [COMPLEMENTAR APÓS VISTORIA]
- Para quesitos, criar estrutura com "Quesito X:" e "Resposta:" para preenchimento
- Identificar as partes processualmente corretas (requerente/requerido, reclamante/reclamada)
- Incluir no encerramento: local, data e espaço para assinatura do perito`
}

function promptParecerTecnico(p: Pericia, instrucao: string): string {
  return `Você é um perito judicial experiente no estado do Rio de Janeiro, Brasil.

Gere um parecer técnico profissional com os dados abaixo.

DADOS DO PROCESSO:
- Número: ${p.processo}
- Vara: ${p.vara}
- Assunto: ${p.assunto}
- Referência Interna: ${p.numero}

INSTRUÇÃO DO PERITO: ${instrucao || 'Gerar parecer técnico objetivo.'}

FORMATO REQUERIDO:
Estruture o parecer com:
1. OBJETO
2. ANÁLISE TÉCNICA
3. CONCLUSÃO
4. ASSINATURA

Linguagem formal e direta. Usar [COMPLEMENTAR] onde necessário.`
}

function promptRespostaQuesitos(p: Pericia, instrucao: string): string {
  return `Você é um perito judicial experiente no estado do Rio de Janeiro, Brasil.

Gere uma estrutura de resposta a quesitos para o processo abaixo.

DADOS DO PROCESSO:
- Número: ${p.processo}
- Vara: ${p.vara}
- Assunto: ${p.assunto}
- Referência Interna: ${p.numero}

INSTRUÇÃO DO PERITO: ${instrucao || 'Gerar estrutura padrão de resposta a quesitos.'}

FORMATO REQUERIDO:
Crie a estrutura de resposta organizada em:
- QUESITOS DO JUÍZO (5 quesitos exemplo com respostas estruturadas)
- QUESITOS DO AUTOR (3 quesitos exemplo)
- QUESITOS DO RÉU/RECLAMADO (3 quesitos exemplo)

Para cada quesito: "Quesito N: [enunciado exemplo]" + "Resposta: [resposta técnica ou [PREENCHER]]"
Linguagem técnica e precisa, compatível com perícia judicial.`
}

// ─── Geração via Claude API ───────────────────────────────────────────────────

async function gerarComClaude(prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  return block.type === 'text' ? block.text : ''
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function gerarDocumentoIA(params: ParamsGerarDoc): Promise<string> {
  const { tipo, nomeModelo, pericia, instrucao = '' } = params

  const apiKey = process.env.ANTHROPIC_API_KEY
  const useAI = !!(apiKey && apiKey.trim().length > 0)

  if (!useAI) {
    // fallback para templates estáticos quando não há API key
    const { gerarPropostaHonorarios, gerarLaudo, gerarParecerTecnico, gerarRespostaQuesitos } =
      await import('@/lib/utils/templates')

    switch (tipo) {
      case 'PROPOSTA_HONORARIOS': return gerarPropostaHonorarios(pericia)
      case 'LAUDO': return gerarLaudo(pericia, nomeModelo)
      case 'PARECER_TECNICO': return gerarParecerTecnico(pericia)
      case 'RESPOSTA_QUESITOS': return gerarRespostaQuesitos(pericia)
      default: return gerarLaudo(pericia, nomeModelo)
    }
  }

  let prompt: string
  switch (tipo) {
    case 'PROPOSTA_HONORARIOS':
      prompt = promptPropostaHonorarios(pericia, instrucao)
      break
    case 'LAUDO':
      prompt = promptLaudo(pericia, nomeModelo, instrucao)
      break
    case 'PARECER_TECNICO':
      prompt = promptParecerTecnico(pericia, instrucao)
      break
    case 'RESPOSTA_QUESITOS':
      prompt = promptRespostaQuesitos(pericia, instrucao)
      break
    default:
      prompt = promptLaudo(pericia, nomeModelo, instrucao)
  }

  try {
    return await gerarComClaude(prompt)
  } catch {
    // Fallback para template se a chamada à API falhar (chave inválida, limite, etc.)
    const { gerarPropostaHonorarios, gerarLaudo, gerarParecerTecnico, gerarRespostaQuesitos } =
      await import('@/lib/utils/templates')
    switch (tipo) {
      case 'PROPOSTA_HONORARIOS': return gerarPropostaHonorarios(pericia)
      case 'LAUDO': return gerarLaudo(pericia, nomeModelo)
      case 'PARECER_TECNICO': return gerarParecerTecnico(pericia)
      case 'RESPOSTA_QUESITOS': return gerarRespostaQuesitos(pericia)
      default: return gerarLaudo(pericia, nomeModelo)
    }
  }
}

export function iaConfigurada(): boolean {
  const key = process.env.ANTHROPIC_API_KEY
  return !!(key && key.startsWith('sk-ant-') && key.trim().length > 20)
}
