// DataJud — API Pública do CNJ (gratuita)
// Documentação: https://datajud-wiki.cnj.jus.br/api-publica

const BASE_URL = 'https://api-publica.datajud.cnj.jus.br'

// Chave pública CNJ (pode ser substituída via DATAJUD_API_KEY)
const PUBLIC_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

function getApiKey(): string {
  return process.env.DATAJUD_API_KEY ?? PUBLIC_KEY
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParteDataJud {
  nome: string
  tipo: string // AUTOR | REU | INTERESSADO | PERITO | etc.
}

export interface ProcessoDataJud {
  numeroProcesso: string
  tribunal: string
  classe: string | null
  assunto: string | null
  orgaoJulgador: string | null
  dataDistribuicao: string | null  // YYYY-MM-DD
  dataUltimaAtu: string | null     // YYYY-MM-DD
  partes: ParteDataJud[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface RawHit {
  _source: {
    numeroProcesso?: string
    tribunal?: string | { codigo?: string; nome?: string }
    classe?: { codigo?: number; nome?: string }
    assunto?: { codigo?: number; nome?: string } | { codigo?: number; nome?: string }[]
    orgaoJulgador?: { nome?: string; codigo?: number }
    dataAjuizamento?: string
    dataUltimaAtualizacao?: string
    partes?: { nome?: string; polo?: string; tipo?: { nome?: string } }[]
  }
}

function parseHit(hit: RawHit, fallbackTribunal: string): ProcessoDataJud | null {
  const s = hit._source
  if (!s.numeroProcesso) return null

  const tribunal =
    typeof s.tribunal === 'string'
      ? s.tribunal
      : s.tribunal?.nome ?? fallbackTribunal

  const classe = Array.isArray(s.classe)
    ? (s.classe as { nome?: string }[])[0]?.nome ?? null
    : (s.classe as { nome?: string } | undefined)?.nome ?? null

  const assuntoRaw = Array.isArray(s.assunto)
    ? s.assunto[0]
    : s.assunto
  const assunto = (assuntoRaw as { nome?: string } | undefined)?.nome ?? null

  const orgaoJulgador = s.orgaoJulgador?.nome ?? null

  // Normalise date to YYYY-MM-DD
  const toDate = (d?: string) => {
    if (!d) return null
    return d.slice(0, 10)
  }

  const partes: ParteDataJud[] = (s.partes ?? []).map((p) => ({
    nome: p.nome ?? '',
    tipo: p.polo ?? p.tipo?.nome ?? '',
  }))

  return {
    numeroProcesso: s.numeroProcesso,
    tribunal,
    classe,
    assunto,
    orgaoJulgador,
    dataDistribuicao: toDate(s.dataAjuizamento),
    dataUltimaAtu: toDate(s.dataUltimaAtualizacao),
    partes,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Busca processos por nome de parte no DataJud.
 * @param nome  Nome do perito (ou variação)
 * @param alias Alias do tribunal (ex: "tjrj")
 * @param days  Janela de busca em dias a partir de hoje (padrão 60 = 2 meses)
 *
 * IMPORTANTE: DataJud indexa `partes` como campo nested no ElasticSearch.
 * A query deve usar `nested` path, caso contrário retorna zero resultados.
 */
export async function searchByName(
  nome: string,
  alias: string,
  days = 60,
): Promise<ProcessoDataJud[]> {
  const url = `${BASE_URL}/api_publica_${alias}/_search`

  const body = {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: 'partes',
              query: {
                match_phrase: {
                  'partes.nome': nome,
                },
              },
            },
          },
        ],
        filter: [
          {
            range: {
              dataUltimaAtualizacao: {
                gte: `now-${days}d/d`,
                lte: 'now/d',
              },
            },
          },
        ],
      },
    },
    size: 30,
    _source: [
      'numeroProcesso',
      'tribunal',
      'classe',
      'assunto',
      'orgaoJulgador',
      'dataAjuizamento',
      'dataUltimaAtualizacao',
      'partes',
    ],
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `APIKey ${getApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return []

    const json = await res.json() as { hits?: { hits?: RawHit[] } }
    const hits = json?.hits?.hits ?? []
    return hits
      .map((h) => parseHit(h, alias.toUpperCase()))
      .filter((p): p is ProcessoDataJud => p !== null)
  } catch {
    return []
  }
}

/**
 * Busca processo por número CNJ exato.
 */
export async function getByNumero(
  numeroProcesso: string,
  alias: string,
): Promise<ProcessoDataJud | null> {
  const url = `${BASE_URL}/api_publica_${alias}/_search`

  const body = {
    query: {
      term: {
        'numeroProcesso.keyword': numeroProcesso,
      },
    },
    size: 1,
    _source: [
      'numeroProcesso',
      'tribunal',
      'classe',
      'assunto',
      'orgaoJulgador',
      'dataAjuizamento',
      'dataUltimaAtualizacao',
      'partes',
    ],
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `APIKey ${getApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return null

    const json = await res.json() as { hits?: { hits?: RawHit[] } }
    const hit = json?.hits?.hits?.[0]
    if (!hit) return null
    return parseHit(hit, alias.toUpperCase())
  } catch {
    return null
  }
}
