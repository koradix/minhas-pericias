// ─── Templates de vistoria guiada por tipo de perícia ─────────────────────────

export interface ItemTemplate {
  titulo: string
  instrucao: string
  precisaFoto: boolean
  precisaValor: boolean
  labelValor?: string
  placeholderValor?: string
  tipoValor?: 'text' | 'number'
  repete?: boolean          // true = pode adicionar múltiplos (ex: vários equipamentos)
  rotuloCopiar?: string     // label do botão "+ Adicionar outro"
}

export interface TemplateVistoria {
  id: string
  label: string
  icone: string
  cor: string               // Tailwind bg color para o badge
  itens: ItemTemplate[]
}

// ─── Energia Elétrica ─────────────────────────────────────────────────────────

const ENERGIA: TemplateVistoria = {
  id: 'energia',
  label: 'Energia Elétrica',
  icone: '⚡',
  cor: 'bg-amber-100 text-amber-800',
  itens: [
    {
      titulo: 'Medidor / Relógio de energia',
      instrucao: 'Fotografe o medidor de energia (relógio). Anote o número de série ou código do equipamento.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Número do medidor',
      placeholderValor: 'Ex: 00123456 / UC-98765',
      tipoValor: 'text',
    },
    {
      titulo: 'Quadro de distribuição (disjuntores)',
      instrucao: 'Fotografe o quadro elétrico com a porta aberta. Anote a quantidade de disjuntores e a corrente total.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Corrente total / nº de disjuntores',
      placeholderValor: 'Ex: 60A / 12 disjuntores',
      tipoValor: 'text',
    },
    {
      titulo: 'Aterramento',
      instrucao: 'Verifique e fotografe o ponto de aterramento. Indique se está presente e em boas condições.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Situação do aterramento',
      placeholderValor: 'Ex: Presente, cabo 6mm², boa condição',
      tipoValor: 'text',
    },
    {
      titulo: 'Equipamento elétrico',
      instrucao: 'Fotografe o equipamento. Anote marca, modelo e potência nominal (na plaqueta ou manual).',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Marca / Modelo / Potência (W ou kW)',
      placeholderValor: 'Ex: Midea Split 9000 BTU — 900W',
      tipoValor: 'text',
      repete: true,
      rotuloCopiar: '+ Adicionar equipamento',
    },
    {
      titulo: 'Instalação elétrica geral',
      instrucao: 'Fotografe a fiação e eletrodutos visíveis. Descreva as condições gerais da instalação.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Observações gerais',
      placeholderValor: 'Ex: Fiação embutida em eletroduto, sem irregularidades aparentes',
      tipoValor: 'text',
    },
    {
      titulo: 'Medição de tensão (se aplicável)',
      instrucao: 'Se possuir multímetro, anote as tensões medidas nas fases.',
      precisaFoto: false,
      precisaValor: true,
      labelValor: 'Tensão medida (V)',
      placeholderValor: 'Ex: Fase A 127V / Fase B 126V / Fase C 128V',
      tipoValor: 'text',
    },
  ],
}

// ─── Hidráulica / Água ────────────────────────────────────────────────────────

const HIDRAULICA: TemplateVistoria = {
  id: 'hidraulica',
  label: 'Hidráulica / Água',
  icone: '💧',
  cor: 'bg-sky-100 text-sky-800',
  itens: [
    {
      titulo: 'Hidrômetro (medidor de água)',
      instrucao: 'Fotografe o hidrômetro. Anote o número de série e leitura atual.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Nº série / Leitura atual (m³)',
      placeholderValor: 'Ex: SN-00123 / 1.234 m³',
      tipoValor: 'text',
    },
    {
      titulo: 'Registro geral e barrilete',
      instrucao: 'Fotografe o registro geral de entrada. Verifique se está operacional.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Condição',
      placeholderValor: 'Ex: Funcional, sem vazamentos',
      tipoValor: 'text',
    },
    {
      titulo: 'Ponto de vazamento identificado',
      instrucao: 'Fotografe cada ponto de vazamento. Descreva localização e intensidade.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Localização e descrição',
      placeholderValor: 'Ex: Teto banheiro social — 2º pavimento, gotejamento constante',
      tipoValor: 'text',
      repete: true,
      rotuloCopiar: '+ Adicionar ponto de vazamento',
    },
    {
      titulo: 'Instalações gerais de água fria e quente',
      instrucao: 'Fotografe tubulações expostas. Anote diâmetros e material das tubulações.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Material / Diâmetro / Condição',
      placeholderValor: 'Ex: PVC 25mm, boa condição',
      tipoValor: 'text',
    },
  ],
}

// ─── Engenharia Civil / Danos estruturais ─────────────────────────────────────

const ENGENHARIA_CIVIL: TemplateVistoria = {
  id: 'engenharia_civil',
  label: 'Engenharia Civil',
  icone: '🏗️',
  cor: 'bg-slate-100 text-slate-700',
  itens: [
    {
      titulo: 'Fachada / Área externa',
      instrucao: 'Fotografe a fachada completa (frente, laterais e fundos, se acessíveis). Anote anomalias visíveis.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Anomalias externas',
      placeholderValor: 'Ex: Trincas na platibanda, pintura deteriorada',
      tipoValor: 'text',
    },
    {
      titulo: 'Dano identificado',
      instrucao: 'Fotografe cada dano relevante. Indique localização, dimensão estimada e provável causa.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Localização / Dimensão / Causa provável',
      placeholderValor: 'Ex: Trinca diagonal — parede sala, 1,2m, recalque diferencial',
      tipoValor: 'text',
      repete: true,
      rotuloCopiar: '+ Adicionar dano',
    },
    {
      titulo: 'Estrutura (pilares, vigas, laje)',
      instrucao: 'Fotografe os elementos estruturais aparentes. Anote condição geral.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Condição estrutural',
      placeholderValor: 'Ex: Sem anomalias estruturais aparentes',
      tipoValor: 'text',
    },
    {
      titulo: 'Cobertura / Telhado',
      instrucao: 'Se acessível, fotografe a cobertura. Indique material, estado e presença de infiltrações.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Material / Estado / Infiltrações',
      placeholderValor: 'Ex: Telha cerâmica, 30% quebradas, manchas de infiltração no forro',
      tipoValor: 'text',
    },
  ],
}

// ─── Avaliação de imóvel ──────────────────────────────────────────────────────

const AVALIACAO_IMOVEL: TemplateVistoria = {
  id: 'avaliacao_imovel',
  label: 'Avaliação de Imóvel',
  icone: '🏠',
  cor: 'bg-emerald-100 text-emerald-800',
  itens: [
    {
      titulo: 'Identificação do imóvel',
      instrucao: 'Fotografe a entrada principal e placa/número do imóvel. Confirme o endereço.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Endereço confirmado',
      placeholderValor: 'Ex: Rua X, 100 — Apto 201 — confirmado no local',
      tipoValor: 'text',
    },
    {
      titulo: 'Área total e divisão dos cômodos',
      instrucao: 'Anote a área total, nº de quartos, banheiros e ambientes de uso comum.',
      precisaFoto: false,
      precisaValor: true,
      labelValor: 'Área / Distribuição',
      placeholderValor: 'Ex: 85m² — 2 quartos, 1 suíte, 2 banheiros, sala, cozinha',
      tipoValor: 'text',
    },
    {
      titulo: 'Padrão de acabamento',
      instrucao: 'Fotografe pisos, forros e esquadrias. Classifique o padrão de acabamento.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Padrão (normal/médio/alto)',
      placeholderValor: 'Ex: Médio — porcelanato 60x60, esquadrias de alumínio',
      tipoValor: 'text',
    },
    {
      titulo: 'Estado de conservação',
      instrucao: 'Descreva o estado geral de conservação com base na vistoria.',
      precisaFoto: true,
      precisaValor: true,
      labelValor: 'Estado (novo/bom/regular/ruim)',
      placeholderValor: 'Ex: Bom — pintura recente, sem anomalias relevantes',
      tipoValor: 'text',
    },
  ],
}

// ─── Registro e exportação ────────────────────────────────────────────────────

export const TEMPLATES_VISTORIA: TemplateVistoria[] = [
  ENERGIA,
  HIDRAULICA,
  ENGENHARIA_CIVIL,
  AVALIACAO_IMOVEL,
]

export function detectarTemplate(tipo: string): TemplateVistoria | null {
  const t = tipo.toLowerCase()
  if (/energ|eletri|elétri/.test(t)) return ENERGIA
  if (/hidraul|água|agua|vazam/.test(t)) return HIDRAULICA
  if (/engenharia civil|estrutur|constru|dano/.test(t)) return ENGENHARIA_CIVIL
  if (/avalia|imóvel|imovel/.test(t)) return AVALIACAO_IMOVEL
  return null
}
