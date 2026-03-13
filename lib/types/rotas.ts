export type TipoRota = 'PROSPECCAO' | 'PERICIA'
export type StatusRota = 'planejada' | 'em_execucao' | 'concluida' | 'cancelada'
export type TipoPontoRota = 'VARA_CIVEL' | 'FORUM' | 'ESCRITORIO' | 'PERICIA'

export interface PontoRota {
  id: string
  rotaId: string
  nome: string
  latitude: number
  longitude: number
  tipo: TipoPontoRota
  ordem: number
  endereco?: string
}

export interface Rota {
  id: string
  tipo: TipoRota
  titulo: string
  data: string
  status: StatusRota
  distanciaKm: number
  tempoEstimadoMin: number
  custoEstimado: number
  pontos: PontoRota[]
}