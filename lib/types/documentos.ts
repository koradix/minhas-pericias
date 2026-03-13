export type TipoDocumento =
  | 'LAUDO'
  | 'PROPOSTA_HONORARIOS'
  | 'PARECER_TECNICO'
  | 'RESPOSTA_QUESITOS'

export type StatusDocumento = 'rascunho' | 'gerado' | 'revisado' | 'finalizado'

export interface ArquivoTreinamento {
  id: string
  nome: string
  tipo: 'PDF' | 'DOCX'
  tamanhoKb: number
  enviadoEm: string
}

export interface ModeloDocumento {
  id: string
  tipo: TipoDocumento
  nome: string
  descricao: string
  totalUsos: number
  criadoEm: string
  arquivosTreinamento: ArquivoTreinamento[]
}

export interface DocumentoGerado {
  id: string
  tipo: TipoDocumento
  titulo: string
  periciaId?: string
  demandaId?: string
  modeloId?: string
  status: StatusDocumento
  conteudo: string
  instrucaoUsuario?: string
  dataCriacao: string
  dataAtualizacao: string
}
