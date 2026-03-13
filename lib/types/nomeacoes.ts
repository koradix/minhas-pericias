export type PrioridadeVara = 'ALTA' | 'MEDIA' | 'BAIXA'

export interface NomeacaoPericia {
  id: string
  tribunal: string
  comarca: string
  vara: string
  juiz: string
  processo: string
  data: string
  especialidade?: string
}

export interface EstatisticaVara {
  vara: string
  juiz: string
  tribunal: string
  comarca: string
  totalPericias: number
  prioridade: PrioridadeVara
  especialidades?: string[]
  ultimaNomeacao?: string
}
