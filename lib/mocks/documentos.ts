import type { ModeloDocumento, DocumentoGerado } from '@/lib/types/documentos'

export const modelos: ModeloDocumento[] = [
  {
    id: 'MOD-001',
    tipo: 'LAUDO',
    nome: 'Laudo de Avaliação de Imóvel',
    descricao: 'Modelo padrão para laudos de avaliação imobiliária residencial e comercial. Inclui metodologia ABNT NBR 14653.',
    totalUsos: 24,
    criadoEm: '01/10/2024',
    arquivosTreinamento: [
      { id: 'A1', nome: 'laudo-modelo-imobiliario.pdf', tipo: 'PDF', tamanhoKb: 420, enviadoEm: '01/10/2024' },
      { id: 'A2', nome: 'metodologia-avaliacao.docx', tipo: 'DOCX', tamanhoKb: 180, enviadoEm: '05/10/2024' },
    ],
  },
  {
    id: 'MOD-002',
    tipo: 'LAUDO',
    nome: 'Laudo Contábil Societário',
    descricao: 'Template para apuração de haveres e laudos contábeis em dissolução parcial de sociedade.',
    totalUsos: 12,
    criadoEm: '15/10/2024',
    arquivosTreinamento: [
      { id: 'A3', nome: 'laudo-contabil-referencia.pdf', tipo: 'PDF', tamanhoKb: 560, enviadoEm: '15/10/2024' },
    ],
  },
  {
    id: 'MOD-003',
    tipo: 'PROPOSTA_HONORARIOS',
    nome: 'Proposta de Honorários Periciais',
    descricao: 'Proposta profissional com escopo de trabalho, metodologia, prazo e forma de pagamento.',
    totalUsos: 38,
    criadoEm: '10/09/2024',
    arquivosTreinamento: [
      { id: 'A4', nome: 'proposta-modelo.docx', tipo: 'DOCX', tamanhoKb: 95, enviadoEm: '10/09/2024' },
    ],
  },
  {
    id: 'MOD-004',
    tipo: 'RESPOSTA_QUESITOS',
    nome: 'Resposta a Quesitos — Avaliação',
    descricao: 'Estrutura para resposta a quesitos de partes e assistentes técnicos em perícias de avaliação.',
    totalUsos: 17,
    criadoEm: '20/11/2024',
    arquivosTreinamento: [],
  },
  {
    id: 'MOD-005',
    tipo: 'PARECER_TECNICO',
    nome: 'Parecer Técnico Simplificado',
    descricao: 'Documento técnico objetivo para manifestações rápidas em processos ou demandas extrajudiciais.',
    totalUsos: 8,
    criadoEm: '01/12/2024',
    arquivosTreinamento: [
      { id: 'A5', nome: 'parecer-referencia.pdf', tipo: 'PDF', tamanhoKb: 210, enviadoEm: '01/12/2024' },
    ],
  },
]

export const documentosGerados: DocumentoGerado[] = [
  {
    id: 'DOC-001',
    tipo: 'LAUDO',
    titulo: 'Laudo de Avaliação — PRC-2024-001',
    periciaId: 'PRC-2024-001',
    modeloId: 'MOD-001',
    status: 'finalizado',
    conteudo: '',
    instrucaoUsuario: 'Gerar laudo de avaliação de imóvel residencial conforme vistoria realizada em 15/12/2024.',
    dataCriacao: '15/12/2024',
    dataAtualizacao: '16/12/2024',
  },
  {
    id: 'DOC-002',
    tipo: 'LAUDO',
    titulo: 'Laudo Contábil Societário — PRC-2024-003',
    periciaId: 'PRC-2024-003',
    modeloId: 'MOD-002',
    status: 'revisado',
    conteudo: '',
    dataCriacao: '10/12/2024',
    dataAtualizacao: '12/12/2024',
  },
  {
    id: 'DOC-003',
    tipo: 'PROPOSTA_HONORARIOS',
    titulo: 'Proposta — Demanda DMD-001',
    demandaId: 'DMD-001',
    modeloId: 'MOD-003',
    status: 'gerado',
    conteudo: '',
    instrucaoUsuario: 'Proposta para perícia trabalhista, incluir cláusula de adiantamento de 30%.',
    dataCriacao: '08/12/2024',
    dataAtualizacao: '08/12/2024',
  },
  {
    id: 'DOC-004',
    tipo: 'RESPOSTA_QUESITOS',
    titulo: 'Resposta a Quesitos — PRC-2024-004',
    periciaId: 'PRC-2024-004',
    modeloId: 'MOD-004',
    status: 'rascunho',
    conteudo: '',
    instrucaoUsuario: 'Responder 12 quesitos da parte ré sobre metodologia de avaliação do estabelecimento.',
    dataCriacao: '05/12/2024',
    dataAtualizacao: '05/12/2024',
  },
  {
    id: 'DOC-005',
    tipo: 'PARECER_TECNICO',
    titulo: 'Parecer Técnico — PRC-2024-002',
    periciaId: 'PRC-2024-002',
    status: 'finalizado',
    conteudo: '',
    dataCriacao: '01/12/2024',
    dataAtualizacao: '03/12/2024',
  },
]

export const statusMapDocumentos = {
  rascunho: { label: 'Rascunho', variant: 'secondary' as const },
  gerado: { label: 'Gerado', variant: 'info' as const },
  revisado: { label: 'Revisado', variant: 'warning' as const },
  finalizado: { label: 'Finalizado', variant: 'success' as const },
}

export const tipoDocumentoLabels: Record<string, string> = {
  LAUDO: 'Laudo',
  PROPOSTA_HONORARIOS: 'Proposta de Honorários',
  PARECER_TECNICO: 'Parecer Técnico',
  RESPOSTA_QUESITOS: 'Resposta a Quesitos',
}
