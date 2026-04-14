/**
 * Prompts especializados para geração de laudos periciais.
 *
 * Estrutura:
 * 1. SYSTEM_PROMPT_LAUDO — regras absolutas (compartilhado por todos os tipos)
 * 2. Prompts de EXTRAÇÃO — por tipo de documento (conta energia, TOI, conta água)
 * 3. Prompts de GERAÇÃO — por tipo de perícia (energia consumo, energia TOI, saneamento)
 *
 * O sistema escolhe o prompt correto baseado no `templateCategoria`.
 * Se não houver prompt especializado, usa o genérico existente.
 */

// ─── SYSTEM PROMPT — compartilhado ──────────────────────────────────────────

export const SYSTEM_PROMPT_LAUDO = `Você é um assistente especializado em perícia judicial brasileira, integrado ao sistema Perilab.

Seu papel é auxiliar peritos judiciais a elaborar laudos periciais técnicos com base em:
- Dados do processo judicial (fornecidos em JSON pelo sistema)
- Documentos do processo (petição, contestação, decisões)
- Documentos técnicos enviados pelo perito (contas, TOI, históricos)
- Fotos da vistoria (já vinculadas ao processo)
- Respostas do formulário preenchido pelo perito

REGRAS ABSOLUTAS:
1. Nunca invente dados, medições, valores ou datas. Se a informação não estiver disponível, mantenha o placeholder original {{campo}}.
2. Nunca omita seções obrigatórias do template. Estrutura não muda.
3. Linguagem: técnica, formal, impessoal (3ª pessoa, voz passiva).
4. Siga RIGOROSAMENTE a estrutura do template — não adicione seções.
5. Ao referenciar documentos analisados, cite pelo nome exato (ex: "Conta de energia referente a 03/2024").
6. Ao referenciar fotos, use o marcador exato (ex: "Foto 01", [FOTO_0]).
7. Ao referenciar documentos do processo, use [DOC_X] (ex: [DOC_0] para petição inicial).
8. Valores monetários: sempre em R$ com duas casas decimais.
9. Valores em kWh e m³: sempre com duas casas decimais.
10. Datas: sempre no formato dd/mm/aaaa.
11. Nunca faça afirmações sobre culpa, dolo ou responsabilidade. Conclusões jurídicas cabem ao juiz — você conclui TECNICAMENTE.
12. Quesitos devem ser respondidos diretamente, em linguagem técnica, sem rodeios. Comece com "Sim.", "Não." ou afirmativa direta.
13. Quando o campo não puder ser preenchido automaticamente, deixe exatamente como está: {{nome_do_campo}}.

REGRAS DE FORMATAÇÃO (.DOCX):
- Títulos claros numerados (1., 2., 3.)
- Parágrafos organizados e espaçados
- NÃO use markdown (sem **, ##, -, etc.)
- Texto limpo e formal, compatível com Word

REGRAS DE CAMPOS EDITÁVEIS:
- Quando não tiver dados suficientes, use {{nome_do_campo}} como placeholder
- Nunca deixe seção vazia — gere versão preliminar com {{campo}} onde necessário
- Para análise técnica que depende de vistoria, use {{COMPLEMENTAR_APOS_VISTORIA}}

REGRAS DE QUESITOS:
- Responda cada quesito individualmente
- Comece com "Sim.", "Não." ou afirmativa direta
- Máximo 5 linhas por quesito
- Para quesitos sem dados, use {{RESPOSTA_QUESITO_X}}

RETORNE APENAS JSON VÁLIDO neste formato exato:
{
  "secoes": [
    {
      "titulo": "Título exato da seção do template",
      "conteudo": "Texto completo da seção, formal, com [FOTO_X] e [DOC_X] onde relevante",
      "fotosReferenciadas": [0, 3],
      "docsReferenciados": [0, 1]
    }
  ],
  "qa": {
    "campos_faltantes": ["lista de dados que não foram fornecidos"],
    "observacoes": ["sugestões práticas para o perito melhorar o laudo"]
  }
}

Sem texto antes ou depois do JSON. Sem markdown.`

// ─── EXTRAÇÃO: CONTA DE ENERGIA ─────────────────────────────────────────────

export const PROMPT_EXTRACAO_CONTA_ENERGIA = `Analise as imagens/PDFs das contas de energia elétrica fornecidos.
Extraia os dados a seguir e retorne SOMENTE um objeto JSON válido, sem texto adicional.

Se um campo não estiver visível ou legível, use null.
Para tabelas de histórico, extraia TODAS as linhas visíveis.

{
  "nome_titular": "string",
  "numero_cliente": "string",
  "nome_concessionaria_abrev": "string — ex: ENEL, CEMIG, LIGHT",
  "endereco_uc": "string",
  "historico": [
    { "data_leitura": "dd/mm/aaaa", "modo_faturamento": "REAL|ESTIMADA|INFORMADA", "consumo_lido_kwh": number, "consumo_faturado_kwh": number }
  ],
  "media_consumo_kwh": number,
  "periodo_media_consumo": "string — ex: '01/2022 a 12/2023'",
  "media_consumo_reclamada_kwh": number,
  "observacoes": "string"
}`

// ─── EXTRAÇÃO: TOI ──────────────────────────────────────────────────────────

export const PROMPT_EXTRACAO_TOI = `Analise o documento TOI (Termo de Ocorrência de Infração/Irregularidade).
Extraia e retorne SOMENTE um objeto JSON válido.

{
  "numero_toi": "string",
  "nome_concessionaria_abrev": "string",
  "numero_cliente": "string",
  "data_lavratura": "dd/mm/aaaa",
  "periodo_toi": "string — ex: '03/2021 a 06/2023'",
  "consumo_medio_periodo_toi": number,
  "tipo_irregularidade": "string",
  "valor_cobrado": number,
  "documentos_toi_tarl": "string — frase completa para uso direto no laudo"
}`

// ─── EXTRAÇÃO: CONTA DE ÁGUA ────────────────────────────────────────────────

export const PROMPT_EXTRACAO_CONTA_AGUA = `Analise as imagens/PDFs das contas de água.
Extraia e retorne SOMENTE um objeto JSON válido.

{
  "nome_concessionaria": "string — ex: CEDAE, Águas do Rio",
  "numero_matricula": "string",
  "numero_hidrometro_anterior": "string ou null",
  "numero_hidrometro_atual": "string",
  "data_substituicao_hidrometro": "dd/mm/aaaa ou null",
  "historico": [
    { "mes_ref": "MM/AAAA", "leitura_m3": number, "faturado_m3": number, "observacao": "string" }
  ],
  "observacoes_gerais": "string"
}`

// ─── CONTEXTO REGULATÓRIO ───────────────────────────────────────────────────

const CTX_ENERGIA = `
CONTEXTO REGULATÓRIO ENERGIA:
- Resolução ANEEL 1.000/2021
- Art. 590: concessionária DEVE lavrar TOI com conjunto probatório
- Art. 591: TOI entregue ao consumidor com recibo assinado
- Art. 595: valor retroativo = diferença entre faturado e apurado
- Art. 596: prazo máximo de cobrança retroativa é 36 meses`

const CTX_SANEAMENTO = `
CONTEXTO REGULATÓRIO SANEAMENTO:
- CDC Art. 42 §único: cobrança indevida paga = devolução em dobro
- IN 120/2024 AGENERSA Art. 2º Inc. VIII: hidrômetro defeituoso → suspensão ou devolução em dobro
- Lei 11.445/2007 Art. 22: cobrança só após efetiva prestação do serviço
- Decreto Estadual RJ 22.872/1996 Art. 43: ligação definitiva só com solicitação formal`

// ─── MAPEAMENTO: categoria do template → prompt especializado ───────────────

type TipoLaudo = 'energia_consumo' | 'energia_toi' | 'saneamento_agua' | 'generico'

/** Detecta o tipo de laudo a partir da categoria do template */
export function detectarTipoLaudo(categoria: string): TipoLaudo {
  const c = categoria.toLowerCase()
  if (c.includes('toi') || c.includes('irregularidade') || c.includes('infração')) return 'energia_toi'
  if (c.includes('energia') || c.includes('elétrica') || c.includes('eletrica') || c.includes('consumo')) return 'energia_consumo'
  if (c.includes('água') || c.includes('agua') || c.includes('saneamento') || c.includes('hidro')) return 'saneamento_agua'
  return 'generico'
}

/** Retorna o contexto regulatório para o tipo de laudo */
export function getContextoRegulatorio(tipo: TipoLaudo): string {
  switch (tipo) {
    case 'energia_consumo':
    case 'energia_toi':
      return CTX_ENERGIA
    case 'saneamento_agua':
      return CTX_SANEAMENTO
    default:
      return ''
  }
}

/** Retorna o prompt de extração para o tipo de documento */
export function getPromptExtracao(tipoDocumento: string): string {
  const t = tipoDocumento.toLowerCase()
  if (t.includes('toi') || t.includes('termo de ocorrência')) return PROMPT_EXTRACAO_TOI
  if (t.includes('energia') || t.includes('elétrica') || t.includes('kwh')) return PROMPT_EXTRACAO_CONTA_ENERGIA
  if (t.includes('água') || t.includes('agua') || t.includes('saneamento') || t.includes('hidro')) return PROMPT_EXTRACAO_CONTA_AGUA
  return '' // sem prompt especializado
}

// ─── REGRAS PARA QUESITOS ───────────────────────────────────────────────────

export const REGRAS_QUESITOS = `
REGRAS PARA RESPOSTAS AOS QUESITOS:
- Comece cada resposta com "Sim.", "Não." ou afirmativa direta
- Máximo de 5 linhas por quesito
- Baseie-se exclusivamente nos dados fornecidos
- Para quesitos sem dados suficientes, retorne null
- Nunca opine sobre culpa ou responsabilidade jurídica
- Use terminologia técnica da legislação aplicável`
