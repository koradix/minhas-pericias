'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'
import { getCredenciaisTribunal } from '@/lib/actions/credenciais-tribunais'
import { listarCertificados } from '@/lib/actions/certificado-escavador'

// Converte sigla de Diário para sigla de Tribunal:
// DJRJ → TJRJ, DJSP → TJSP, DJMG → TJMG, etc.
// Também tenta TRF, TST, STJ sem alteração.
function siglaParaTribunal(sigla: string): string {
  return sigla
    .replace(/^DJE?[-_]?/, 'TJ')   // DJRJ, DJE-SP, DJE_MG → TJRJ, TJSP, TJMG
    .replace(/^DOER?J?[-_]?/, 'TJ') // fallback extra
    .toUpperCase()
}

export type CitacaoDocResult =
  | { ok: true; status: 'encontrado'; total: number; novos: number }
  | { ok: true; status: 'aguardando' }          // robôs processando, tente em instantes
  | { ok: false; error: string }

export type CitacaoDocumento = {
  id: string
  chaveV2: string | null
  nome: string
  tipo: string | null
  dataPublicacao: string | null
  paginas: number | null
  baixado: boolean
  blobUrl: string | null
}

// ─── Buscar e persistir documentos a partir de uma NomeacaoCitacao ─────────────
//
// Usa as credenciais PJe do perito (se disponíveis) para solicitar
// ao Escavador que autentique no tribunal e baixe os autos do processo.
// Documentos públicos são capturados sem credenciais.

export async function buscarDocumentosPorCitacao(
  citacaoId: string,
): Promise<CitacaoDocResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const citacao = await prisma.nomeacaoCitacao.findUnique({
      where: { id: citacaoId },
      select: { peritoId: true, numeroProcesso: true, diarioSigla: true },
    })
    if (!citacao || citacao.peritoId !== userId) return { ok: false, error: 'Citação não encontrada' }
    const cnj = citacao.numeroProcesso
    if (!cnj) return { ok: false, error: 'Número do processo não disponível nesta citação' }

    const escavador = radar as EscavadorService

    // ── Normalizar sigla: DJRJ → TJRJ (credenciais são salvas pelo tribunal) ──
    const tribunalSigla = siglaParaTribunal(citacao.diarioSigla)
    console.log(`[citacao-documentos] CNJ=${cnj} | diarioSigla=${citacao.diarioSigla} → tribunalSigla=${tribunalSigla}`)

    // ── Garantir registro Processo ─────────────────────────────────────────────
    const proc = await prisma.processo.upsert({
      where: { numeroProcesso: cnj },
      create: { numeroProcesso: cnj, tribunal: tribunalSigla },
      update: {},
    })

    // ── Método de autenticação: certificado A1 (preferencial) ou usuario/senha ──
    // Tenta sigla normalizada (TJRJ) e original (DJRJ) como fallback
    const [certs, credenciaisNorm, credenciaisOrig] = await Promise.all([
      listarCertificados(),
      getCredenciaisTribunal(tribunalSigla),
      getCredenciaisTribunal(citacao.diarioSigla),
    ])
    const credenciais = credenciaisNorm ?? credenciaisOrig
    const temCertificado = certs.length > 0

    console.log(`[citacao-documentos] certificado=${temCertificado} | credenciais=${credenciais ? `${credenciais.usuario}@${tribunalSigla}` : 'nenhuma'}`)

    const flags: Record<string, unknown> = { documentos_publicos: true, autos: true }
    if (temCertificado) {
      flags.utilizar_certificado = true
    } else if (credenciais) {
      flags.usuario = credenciais.usuario
      flags.senha   = credenciais.senha
    }
    const atualizacao = await escavador.solicitarAtualizacaoV2(cnj, flags as Parameters<typeof escavador.solicitarAtualizacaoV2>[1])
    if (!atualizacao.ok) {
      console.warn('[citacao-documentos] solicitar-atualizacao falhou:', atualizacao.message)
    }

    // ── Buscar documentos imediatamente (podem já estar cacheados) ────────────
    const [docsPublicos, docsAutos] = await Promise.all([
      escavador.listarDocumentosPublicosV2(cnj),
      escavador.listarAutosV2(cnj),
    ])

    // Merge sem duplicatas
    const seenKeys = new Set<string>()
    const docsV2 = [...docsPublicos, ...docsAutos].filter((d) => {
      if (seenKeys.has(d.key)) return false
      seenKeys.add(d.key)
      return true
    })

    let novos = 0

    if (docsV2.length > 0) {
      for (const doc of docsV2) {
        try {
          const existing = await prisma.processoDocumento.findFirst({
            where: { processoId: proc.id, chaveV2: doc.key },
          })
          if (!existing) {
            await prisma.processoDocumento.create({
              data: {
                processoId:     proc.id,
                chaveV2:        doc.key,
                nome:           doc.nome,
                tipo:           doc.tipo ?? null,
                dataPublicacao: doc.data ? new Date(doc.data) : null,
                urlPublica:     doc.url ?? null,
                paginas:        doc.paginas ?? null,
              },
            })
            novos++
          }
        } catch { /* skip duplicates */ }
      }
      const total = await prisma.processoDocumento.count({ where: { processoId: proc.id } })
      return { ok: true, status: 'encontrado', total, novos }
    }

    // ── Fallback v1 ────────────────────────────────────────────────────────────
    let escavadorId = proc.escavadorId
    if (!escavadorId) {
      const found = await escavador.buscarProcesso(cnj, citacao.diarioSigla)
      if (found?.id) {
        escavadorId = found.id
        await prisma.processo.update({ where: { id: proc.id }, data: { escavadorId } })
      }
    }
    if (escavadorId) {
      const docsV1 = await escavador.listarDocumentos(escavadorId)
      for (const doc of docsV1) {
        try {
          const existing = await prisma.processoDocumento.findUnique({
            where: { processoId_escavadorDocId: { processoId: proc.id, escavadorDocId: doc.id } },
          })
          if (!existing) {
            await prisma.processoDocumento.create({
              data: {
                processoId:     proc.id,
                escavadorDocId: doc.id,
                nome:           doc.nome,
                tipo:           doc.tipo ?? null,
                dataPublicacao: doc.data ? new Date(doc.data) : null,
                urlPublica:     doc.url ?? null,
                paginas:        doc.paginas ?? null,
              },
            })
            novos++
          }
        } catch { /* skip */ }
      }
      if (novos > 0) {
        const total = await prisma.processoDocumento.count({ where: { processoId: proc.id } })
        return { ok: true, status: 'encontrado', total, novos }
      }
    }

    // Atualização solicitada mas robôs ainda processando
    return { ok: true, status: 'aguardando' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar documentos' }
  }
}

// ─── Listar documentos já salvos para uma citação ────────────────────────────

export async function listarDocumentosPorCitacao(
  citacaoId: string,
): Promise<CitacaoDocumento[]> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return []

  try {
    const citacao = await prisma.nomeacaoCitacao.findUnique({
      where: { id: citacaoId },
      select: { peritoId: true, numeroProcesso: true },
    })
    if (!citacao || citacao.peritoId !== userId || !citacao.numeroProcesso) return []

    const proc = await prisma.processo.findUnique({
      where: { numeroProcesso: citacao.numeroProcesso },
      select: { id: true },
    })
    if (!proc) return []

    const rows = await prisma.processoDocumento.findMany({
      where: { processoId: proc.id },
      orderBy: { dataPublicacao: 'desc' },
    })
    return rows.map((r) => ({
      id:             r.id,
      chaveV2:        r.chaveV2 ?? null,
      nome:           r.nome,
      tipo:           r.tipo ?? null,
      dataPublicacao: r.dataPublicacao ? r.dataPublicacao.toISOString().split('T')[0] : null,
      paginas:        r.paginas ?? null,
      baixado:        r.baixado,
      blobUrl:        r.blobUrl ?? null,
    }))
  } catch { return [] }
}
