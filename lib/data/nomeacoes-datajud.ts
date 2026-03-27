import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NomeacaoComProcesso {
  id: string
  peritoId: string
  status: string
  scoreMatch: number
  criadoEm: string
  // intake fields
  nomeArquivo: string | null
  extractedData: string | null
  processSummary: string | null
  periciaId: string | null
  processo: {
    id: string
    numeroProcesso: string
    tribunal: string
    classe: string | null
    assunto: string | null
    orgaoJulgador: string | null
    dataDistribuicao: string | null
    dataUltimaAtu: string | null
    partes: { nome: string; tipo: string }[]
  }
}

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function getNomeacoesByPerito(
  peritoId: string,
): Promise<NomeacaoComProcesso[]> {
  try {
    const rows = await prisma.nomeacao.findMany({
      where: { peritoId },
      orderBy: [{ scoreMatch: 'desc' }, { criadoEm: 'desc' }],
      include: { processo: true },
    })

    return rows.map((n) => ({
      id: n.id,
      peritoId: n.peritoId,
      status: n.status,
      scoreMatch: n.scoreMatch,
      criadoEm: toISO(n.criadoEm),
      nomeArquivo: n.nomeArquivo ?? null,
      extractedData: n.extractedData ?? null,
      processSummary: n.processSummary ?? null,
      periciaId: n.periciaId ?? null,
      processo: {
        id: n.processo.id,
        numeroProcesso: n.processo.numeroProcesso,
        tribunal: n.processo.tribunal,
        classe: n.processo.classe,
        assunto: n.processo.assunto,
        orgaoJulgador: n.processo.orgaoJulgador,
        dataDistribuicao: n.processo.dataDistribuicao,
        dataUltimaAtu: n.processo.dataUltimaAtu,
        partes: JSON.parse(n.processo.partes ?? '[]') as { nome: string; tipo: string }[],
      },
    }))
  } catch {
    return []
  }
}

export interface KpisDataJud {
  total: number
  novas: number
  excelentes: number  // score >= 75
  bons: number        // score >= 55
}

export async function getKpisDataJud(peritoId: string): Promise<KpisDataJud> {
  try {
    const all = await prisma.nomeacao.findMany({
      where: { peritoId },
      select: { status: true, scoreMatch: true },
    })
    return {
      total:     all.length,
      novas:     all.filter((n) => n.status === 'novo').length,
      excelentes: all.filter((n) => n.scoreMatch >= 75).length,
      bons:       all.filter((n) => n.scoreMatch >= 55).length,
    }
  } catch {
    return { total: 0, novas: 0, excelentes: 0, bons: 0 }
  }
}
