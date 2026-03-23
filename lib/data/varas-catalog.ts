import type { TipoPontoRota } from '@/lib/types/rotas'

export interface VaraCatalog {
  id: string
  nome: string
  tribunal: string   // sigla
  tipo: TipoPontoRota
  endereco: string
  cidade: string
  uf: string
  latitude: number
  longitude: number
}

export const VARAS_CATALOG: VaraCatalog[] = [

  // ── RJ — TJRJ ────────────────────────────────────────────────────────────────
  {
    id: 'rj-tjrj-001',
    nome: 'Fórum Central do Rio de Janeiro',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Av. Erasmo Braga, 115 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9028, longitude: -43.1744,
  },
  {
    id: 'rj-tjrj-002',
    nome: '1ª Vara Cível Central — RJ',
    tribunal: 'TJRJ', tipo: 'VARA_CIVEL',
    endereco: 'Av. Erasmo Braga, 115 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9031, longitude: -43.1747,
  },
  {
    id: 'rj-tjrj-003',
    nome: '3ª Vara Cível Central — RJ',
    tribunal: 'TJRJ', tipo: 'VARA_CIVEL',
    endereco: 'Av. Erasmo Braga, 115 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9033, longitude: -43.1749,
  },
  {
    id: 'rj-tjrj-004',
    nome: '1ª Vara de Família — Centro RJ',
    tribunal: 'TJRJ', tipo: 'VARA_CIVEL',
    endereco: 'Av. Erasmo Braga, 115 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9035, longitude: -43.1751,
  },
  {
    id: 'rj-tjrj-005',
    nome: 'Fórum Regional da Barra da Tijuca',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Av. Ayrton Senna, 2541 — Barra da Tijuca',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -23.0131, longitude: -43.3650,
  },
  {
    id: 'rj-tjrj-006',
    nome: 'Fórum Regional do Méier',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Rua Dias da Cruz, 84 — Méier',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.8968, longitude: -43.2874,
  },
  {
    id: 'rj-tjrj-007',
    nome: 'Fórum Regional de Campo Grande',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Estrada do Monteiro, 895 — Campo Grande',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9055, longitude: -43.5640,
  },
  {
    id: 'rj-tjrj-008',
    nome: 'Fórum Regional de Jacarepaguá',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'R. Aylton Wanderley, 201 — Jacarepaguá',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9466, longitude: -43.3491,
  },
  {
    id: 'rj-tjrj-009',
    nome: 'Fórum Regional de Bangu',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'R. Fonseca, 121 — Bangu',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.8826, longitude: -43.4651,
  },
  {
    id: 'rj-tjrj-010',
    nome: 'Fórum de Niterói',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Rua Visconde do Rio Branco, 382 — Centro',
    cidade: 'Niterói', uf: 'RJ',
    latitude: -22.8994, longitude: -43.1227,
  },
  {
    id: 'rj-tjrj-011',
    nome: '2ª Vara Cível — Niterói',
    tribunal: 'TJRJ', tipo: 'VARA_CIVEL',
    endereco: 'Rua Visconde do Rio Branco, 382 — Centro',
    cidade: 'Niterói', uf: 'RJ',
    latitude: -22.8997, longitude: -43.1230,
  },
  {
    id: 'rj-tjrj-012',
    nome: 'Fórum de Duque de Caxias',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Rua Brigadeiro Brandão, 225',
    cidade: 'Duque de Caxias', uf: 'RJ',
    latitude: -22.7858, longitude: -43.3120,
  },
  {
    id: 'rj-tjrj-013',
    nome: 'Fórum de São Gonçalo',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Av. Presidente Kennedy, 500 — Centro',
    cidade: 'São Gonçalo', uf: 'RJ',
    latitude: -22.8269, longitude: -43.0537,
  },
  {
    id: 'rj-tjrj-014',
    nome: 'Fórum de Nova Iguaçu',
    tribunal: 'TJRJ', tipo: 'FORUM',
    endereco: 'Rua Sargento Brito, 126 — Centro',
    cidade: 'Nova Iguaçu', uf: 'RJ',
    latitude: -22.7591, longitude: -43.4508,
  },

  // ── RJ — TRT-1 ───────────────────────────────────────────────────────────────
  {
    id: 'rj-trt1-001',
    nome: 'TRT-1 — Sede (Centro)',
    tribunal: 'TRT-1', tipo: 'FORUM',
    endereco: 'Av. Presidente Antônio Carlos, 251 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9013, longitude: -43.1752,
  },
  {
    id: 'rj-trt1-002',
    nome: '1ª Vara do Trabalho — Centro RJ',
    tribunal: 'TRT-1', tipo: 'VARA_CIVEL',
    endereco: 'Av. Presidente Antônio Carlos, 251 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9015, longitude: -43.1754,
  },
  {
    id: 'rj-trt1-003',
    nome: '5ª Vara do Trabalho — Niterói',
    tribunal: 'TRT-1', tipo: 'VARA_CIVEL',
    endereco: 'Rua Visconde do Uruguai, 255 — Centro',
    cidade: 'Niterói', uf: 'RJ',
    latitude: -22.8985, longitude: -43.1235,
  },

  // ── RJ — JFRJ ────────────────────────────────────────────────────────────────
  {
    id: 'rj-jfrj-001',
    nome: 'Justiça Federal — Seção Judiciária RJ',
    tribunal: 'JFRJ', tipo: 'FORUM',
    endereco: 'Av. Rio Branco, 243 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9049, longitude: -43.1744,
  },
  {
    id: 'rj-jfrj-002',
    nome: '1ª Vara Federal Cível — RJ',
    tribunal: 'JFRJ', tipo: 'VARA_CIVEL',
    endereco: 'Av. Rio Branco, 243 — Centro',
    cidade: 'Rio de Janeiro', uf: 'RJ',
    latitude: -22.9051, longitude: -43.1746,
  },

  // ── SP — TJSP ─────────────────────────────────────────────────────────────────
  {
    id: 'sp-tjsp-001',
    nome: 'Fórum João Mendes Jr.',
    tribunal: 'TJSP', tipo: 'FORUM',
    endereco: 'Praça João Mendes s/n — Centro',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5487, longitude: -46.6358,
  },
  {
    id: 'sp-tjsp-002',
    nome: '1ª Vara Cível — Fórum João Mendes',
    tribunal: 'TJSP', tipo: 'VARA_CIVEL',
    endereco: 'Praça João Mendes s/n — Centro',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5490, longitude: -46.6361,
  },
  {
    id: 'sp-tjsp-003',
    nome: '5ª Vara Cível — Fórum João Mendes',
    tribunal: 'TJSP', tipo: 'VARA_CIVEL',
    endereco: 'Praça João Mendes s/n — Centro',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5492, longitude: -46.6363,
  },
  {
    id: 'sp-tjsp-004',
    nome: 'Fórum Regional de Santana',
    tribunal: 'TJSP', tipo: 'FORUM',
    endereco: 'Av. Cruzeiro do Sul, 2630 — Santana',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5082, longitude: -46.6280,
  },
  {
    id: 'sp-tjsp-005',
    nome: 'Fórum Regional do Ipiranga',
    tribunal: 'TJSP', tipo: 'FORUM',
    endereco: 'R. Dr. Gentil Leite, 215 — Ipiranga',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5910, longitude: -46.6047,
  },
  {
    id: 'sp-tjsp-006',
    nome: 'Fórum de Guarulhos',
    tribunal: 'TJSP', tipo: 'FORUM',
    endereco: 'R. Voluntários da Pátria, 1290',
    cidade: 'Guarulhos', uf: 'SP',
    latitude: -23.4626, longitude: -46.5347,
  },

  // ── SP — TRT-2 ────────────────────────────────────────────────────────────────
  {
    id: 'sp-trt2-001',
    nome: 'TRT-2 — Sede (Barra Funda)',
    tribunal: 'TRT-2', tipo: 'FORUM',
    endereco: 'R. Boa Vista, 83 — Barra Funda',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5248, longitude: -46.6369,
  },
  {
    id: 'sp-trt2-002',
    nome: '3ª Vara do Trabalho — São Paulo',
    tribunal: 'TRT-2', tipo: 'VARA_CIVEL',
    endereco: 'R. Boa Vista, 83 — Barra Funda',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5251, longitude: -46.6372,
  },

  // ── SP — JFSP ────────────────────────────────────────────────────────────────
  {
    id: 'sp-jfsp-001',
    nome: 'Justiça Federal — Seção Judiciária SP',
    tribunal: 'JFSP', tipo: 'FORUM',
    endereco: 'Av. Paulista, 1842 — Bela Vista',
    cidade: 'São Paulo', uf: 'SP',
    latitude: -23.5630, longitude: -46.6543,
  },

  // ── MG — TJMG ────────────────────────────────────────────────────────────────
  {
    id: 'mg-tjmg-001',
    nome: 'Fórum Lafayette — Belo Horizonte',
    tribunal: 'TJMG', tipo: 'FORUM',
    endereco: 'Rua dos Guajajaras, 40 — Centro',
    cidade: 'Belo Horizonte', uf: 'MG',
    latitude: -19.9191, longitude: -43.9378,
  },
  {
    id: 'mg-trt3-001',
    nome: 'TRT-3 — Belo Horizonte',
    tribunal: 'TRT-3', tipo: 'FORUM',
    endereco: 'Av. do Contorno, 6123 — Savassi',
    cidade: 'Belo Horizonte', uf: 'MG',
    latitude: -19.9354, longitude: -43.9370,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna varas filtradas pelos estados do perito */
export function getVarasParaEstados(estados: string[]): VaraCatalog[] {
  if (estados.length === 0) return VARAS_CATALOG
  return VARAS_CATALOG.filter((v) => estados.includes(v.uf))
}

/** Agrupa varas por estado + tribunal */
export function agruparVarasPorTribunal(
  varas: VaraCatalog[],
): Record<string, VaraCatalog[]> {
  const groups: Record<string, VaraCatalog[]> = {}
  for (const vara of varas) {
    const key = `${vara.uf} — ${vara.tribunal}`
    if (!groups[key]) groups[key] = []
    groups[key].push(vara)
  }
  return groups
}
