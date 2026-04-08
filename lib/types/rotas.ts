export type TipoRota = 'PROSPECCAO' | 'PERICIA'
export type StatusRota = 'planejada' | 'em_execucao' | 'em_andamento' | 'concluida' | 'cancelada'
export type TipoPontoRota = 'VARA_CIVEL' | 'FORUM' | 'ESCRITORIO' | 'PERICIA'

export interface PericiaInfo {
  id: string
  numero: string
  assunto: string
  tipo: string
  status: string
  vara?: string | null
}

export interface PontoRota {
  id: string
  rotaId: string
  nome: string
  latitude: number
  longitude: number
  tipo: TipoPontoRota
  ordem: number
  endereco?: string
  // ── Ligação com Pericia real ─────────────────────────────────────────────────
  periciaId?:   string      // Pericia.id (real FK)
  periciaInfo?: PericiaInfo // dados da perícia vinculada
  // ── Ligação com pericia mock (legado) / vara ─────────────────────────────────
  pericoId?:      string // pericia mock id
  tribunalSigla?: string // para tipo FORUM / VARA_CIVEL
  varaNome?:      string // para tipo FORUM / VARA_CIVEL
  comarca?:       string
  statusCheckpoint?: 'pendente' | 'chegou' | 'concluido'
  // ── Dados de visita ─────────────────────────────────────────────────────────
  varasJson?:       string | null
  juizNome?:        string | null
  secretarioNome?:  string | null
  foiNomeado?:      boolean
  observacoes?:     string | null
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