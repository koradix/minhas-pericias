'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'
import { getCredenciaisTribunal } from '@/lib/actions/credenciais-tribunais'

function siglaParaTribunal(sigla: string): string {
  return sigla.replace(/^DJE?[-_]?/, 'TJ').toUpperCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProcessoSugestao = {
  cnj: string
  tribunal: string
  orgao: string
  partes: string
  dataUltMov: string | null
}

export type BuscarDocumentosResult =
  | { ok: true; novos: number; total: number; suportado: boolean; atualizacaoSolicitada?: boolean }
  | { ok: false; error: string }

export type ProcessoDocumentoRow = {
  id: string
  escavadorDocId: number | null
  chaveV2: string | null
  nome: string
  tipo: string | null
  dataPublicacao: string | null
  urlPublica: string | null
  paginas: number | null
  baixado: boolean
  blobUrl: string | null
}

// ─── Action 1 — Buscar e persistir documentos do processo via Escavador ──────
//
// Fluxo v2 (preferencial):
//   1. solicitar-atualizacao com documentos_publicos=1 (aciona robôs async)
//   2. listar documentos-publicos (pode retornar lista se já processado)
//
// Fluxo v1 (fallback se v2 retornar vazio):
//   Usa escavadorId numérico via endpoint legado

export async function buscarDocumentosNomeacao(
  nomeacaoId: string,
): Promise<BuscarDocumentosResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const nomeacao = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      include: { processo: true },
    })
    if (!nomeacao || nomeacao.peritoId !== userId) {
      return { ok: false, error: 'Nomeação não encontrada' }
    }

    const escavador = radar as EscavadorService
    const cnj = nomeacao.processo.numeroProcesso

    // Busca credenciais PJe do tribunal associado ao processo
    const tribunalSigla = nomeacao.processo.tribunal ?? 'DESCONHECIDO'
    const credenciais = await getCredenciaisTribunal(tribunalSigla)

    // ── Passo 1 — Solicitar atualização v2 (aciona robôs para buscar docs) ──
    const atualizacao = await escavador.solicitarAtualizacaoV2(cnj, {
      documentos_publicos: true,
      autos: true,
      ...(credenciais ? { usuario: credenciais.usuario, senha: credenciais.senha } : {}),
    })
    if (!atualizacao.ok) {
      console.warn('[nomeacoes-documentos] solicitar-atualizacao falhou:', atualizacao.message)
    }

    // ── Passo 2 — Listar documentos públicos v2 + autos ─────────────────────
    const [docsPublicos, docsAutos] = await Promise.all([
      escavador.listarDocumentosPublicosV2(cnj),
      escavador.listarAutosV2(cnj),
    ])
    const seenKeys = new Set<string>()
    const docsV2: typeof docsPublicos = []
    for (const d of [...docsPublicos, ...docsAutos]) {
      if (!seenKeys.has(d.key)) { seenKeys.add(d.key); docsV2.push(d) }
    }

    let novos = 0

    if (docsV2.length > 0) {
      // Persistir documentos v2 — batch atômico
      novos = await prisma.$transaction(async (tx) => {
        let count = 0
        for (const doc of docsV2) {
          const existing = await tx.processoDocumento.findFirst({
            where: { processoId: nomeacao.processoId, chaveV2: doc.key },
          })
          if (!existing) {
            await tx.processoDocumento.create({
              data: {
                processoId:     nomeacao.processoId,
                chaveV2:        doc.key,
                nome:           doc.nome,
                tipo:           doc.tipo ?? null,
                dataPublicacao: doc.data ? new Date(doc.data) : null,
                urlPublica:     doc.url ?? null,
                paginas:        doc.paginas ?? null,
              },
            })
            count++
          }
        }
        return count
      })
    } else {
      // ── Fallback v1 ─────────────────────────────────────────────────────────
      let escavadorId = nomeacao.processo.escavadorId
      if (!escavadorId) {
        const proc = await escavador.buscarProcesso(cnj, nomeacao.processo.tribunal)
        if (proc?.id) {
          escavadorId = proc.id
          await prisma.processo.update({ where: { id: nomeacao.processoId }, data: { escavadorId } })
        }
      }
      if (escavadorId) {
        const docsV1 = await escavador.listarDocumentos(escavadorId)
        novos = await prisma.$transaction(async (tx) => {
          let count = 0
          for (const doc of docsV1) {
            const existing = await tx.processoDocumento.findUnique({
              where: { processoId_escavadorDocId: { processoId: nomeacao.processoId, escavadorDocId: doc.id } },
            })
            if (!existing) {
              await tx.processoDocumento.create({
                data: {
                  processoId:     nomeacao.processoId,
                  escavadorDocId: doc.id,
                  nome:           doc.nome,
                  tipo:           doc.tipo ?? null,
                  dataPublicacao: doc.data ? new Date(doc.data) : null,
                  urlPublica:     doc.url ?? null,
                  paginas:        doc.paginas ?? null,
                },
              })
              count++
            }
          }
          return count
        })
      }
    }

    const total = await prisma.processoDocumento.count({ where: { processoId: nomeacao.processoId } })
    return {
      ok: true,
      novos,
      total,
      suportado: docsV2.length > 0 || novos > 0,
      // Se solicitar-atualizacao ok mas lista ainda vazia, robôs estão processando
      atualizacaoSolicitada: atualizacao.ok && docsV2.length === 0 && total === 0,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar documentos' }
  }
}

// ─── Action 2b — Buscar documentos diretamente pelo CNJ da perícia ───────────
// Funciona mesmo sem nomeação vinculada — usa pericia.processo (CNJ)

export async function buscarDocumentosPorPericia(
  periciaId: string,
): Promise<BuscarDocumentosResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true, processo: true, vara: true },
    })
    if (!pericia || pericia.peritoId !== userId) return { ok: false, error: 'Perícia não encontrada' }

    // Se a pericia não tem CNJ, tenta achar pela nomeação vinculada (Nomeacao ou NomeacaoCitacao)
    let cnj = pericia.processo
    if (!cnj) {
      // Tenta Nomeacao (processo formal)
      const nomeacaoVinculada = await prisma.nomeacao.findFirst({
        where: { periciaId },
        include: { processo: { select: { numeroProcesso: true } } },
      })
      if (nomeacaoVinculada?.processo?.numeroProcesso) {
        cnj = nomeacaoVinculada.processo.numeroProcesso
      }
    }
    if (!cnj) {
      // Tenta NomeacaoCitacao (citação do Diário Oficial vinculada a esta perícia)
      const citacao = await prisma.nomeacaoCitacao.findFirst({
        where: { periciaId, numeroProcesso: { not: null } },
        select: { numeroProcesso: true },
      })
      if (citacao?.numeroProcesso) {
        cnj = citacao.numeroProcesso
      }
    }
    if (cnj) {
      // Salva o CNJ encontrado na perícia para futuras buscas
      await prisma.pericia.update({ where: { id: periciaId }, data: { processo: cnj } }).catch(() => {})
    }
    if (!cnj) return { ok: false, error: 'Número do processo não informado. Vincule uma nomeação ou informe o CNJ.' }

    // Extrair sigla do tribunal da vara (ex: "15ª Vara Cível — TJRJ" → "TJRJ")
    const tribunalSigla = pericia.vara?.match(/\b(TJ[A-Z]{2,4}|TRF\d|TST|STJ|STF)\b/)?.[1] ?? 'DESCONHECIDO'

    // Garantir registro Processo (upsert por CNJ)
    const proc = await prisma.processo.upsert({
      where: { numeroProcesso: cnj },
      create: { numeroProcesso: cnj, tribunal: tribunalSigla },
      update: {},
    })

    const escavador = radar as EscavadorService

    // ── Passo 0: enriquecer Processo com metadados da API (partes, juiz, classe) ─
    const metadados = await escavador.getProcessoV2(cnj)
    if (metadados) {
      const envolvidos = metadados.envolvidos ?? []
      const ativo  = envolvidos.filter((e) => e.polo === 'ATIVO').map((e) => e.nome)
      const passivo = envolvidos.filter((e) => e.polo === 'PASSIVO').map((e) => e.nome)
      const partes = [...ativo.map((n) => ({ nome: n, tipo_parte: 'ATIVO' })), ...passivo.map((n) => ({ nome: n, tipo_parte: 'PASSIVO' }))]
      await prisma.processo.update({
        where: { id: proc.id },
        data: {
          classe: metadados.classe ?? metadados.titulo ?? undefined,
          assunto: metadados.assunto ?? undefined,
          orgaoJulgador: metadados.orgao_julgador ?? undefined,
          dataUltimaAtu: metadados.data_ultima_movimentacao ?? undefined,
          partes: JSON.stringify(partes),
        },
      }).catch(() => {})
    }

    // ── Passo 1: solicitar atualização com documentos públicos E autos ────────────
    // Se o perito tiver credenciais cadastradas para o tribunal, passá-las para que
    // o Escavador possa autenticar no PJe e baixar documentos restritos.
    const credenciais = await getCredenciaisTribunal(tribunalSigla)
    const atualizacao = await escavador.solicitarAtualizacaoV2(cnj, {
      documentos_publicos: true,
      autos: true,
      ...(credenciais ? { usuario: credenciais.usuario, senha: credenciais.senha } : {}),
    })
    if (!atualizacao.ok) console.warn('[buscarDocumentosPorPericia] solicitar-atualizacao falhou:', atualizacao.message)

    // ── Passo 2: listar documentos-publicos e autos (em paralelo) ─────────────────
    const [docsPublicos, docsAutos] = await Promise.all([
      escavador.listarDocumentosPublicosV2(cnj),
      escavador.listarAutosV2(cnj),
    ])

    // Merge sem duplicatas (pela chave)
    const seenKeys = new Set<string>()
    const docsV2: typeof docsPublicos = []
    for (const d of [...docsPublicos, ...docsAutos]) {
      if (!seenKeys.has(d.key)) { seenKeys.add(d.key); docsV2.push(d) }
    }

    let novos = 0

    if (docsV2.length > 0) {
      novos = await prisma.$transaction(async (tx) => {
        let count = 0
        for (const doc of docsV2) {
          const existing = await tx.processoDocumento.findFirst({ where: { processoId: proc.id, chaveV2: doc.key } })
          if (!existing) {
            await tx.processoDocumento.create({
              data: { processoId: proc.id, chaveV2: doc.key, nome: doc.nome, tipo: doc.tipo ?? null, dataPublicacao: doc.data ? new Date(doc.data) : null, urlPublica: doc.url ?? null, paginas: doc.paginas ?? null },
            })
            count++
          }
        }
        return count
      })
    } else {
      // ── Fallback v1 ──────────────────────────────────────────────────────────
      let escavadorId = proc.escavadorId
      if (!escavadorId) {
        const found = await escavador.buscarProcesso(cnj, tribunalSigla)
        if (found?.id) {
          escavadorId = found.id
          await prisma.processo.update({ where: { id: proc.id }, data: { escavadorId } })
        }
      }
      if (escavadorId) {
        const docsV1 = await escavador.listarDocumentos(escavadorId)
        novos = await prisma.$transaction(async (tx) => {
          let count = 0
          for (const doc of docsV1) {
            const existing = await tx.processoDocumento.findUnique({ where: { processoId_escavadorDocId: { processoId: proc.id, escavadorDocId: doc.id } } })
            if (!existing) {
              await tx.processoDocumento.create({
                data: { processoId: proc.id, escavadorDocId: doc.id, nome: doc.nome, tipo: doc.tipo ?? null, dataPublicacao: doc.data ? new Date(doc.data) : null, urlPublica: doc.url ?? null, paginas: doc.paginas ?? null },
              })
              count++
            }
          }
          return count
        })
      }
    }

    const total = await prisma.processoDocumento.count({ where: { processoId: proc.id } })
    return {
      ok: true, novos, total,
      suportado: docsV2.length > 0 || novos > 0,
      atualizacaoSolicitada: atualizacao.ok && docsV2.length === 0 && total === 0,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar documentos' }
  }
}

export async function listarDocumentosPorPericia(
  periciaId: string,
): Promise<ProcessoDocumentoRow[]> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return []

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true, processo: true },
    })
    if (!pericia || pericia.peritoId !== userId || !pericia.processo) return []

    const proc = await prisma.processo.findUnique({ where: { numeroProcesso: pericia.processo }, select: { id: true } })
    if (!proc) return []

    const rows = await prisma.processoDocumento.findMany({
      where: { processoId: proc.id },
      orderBy: { dataPublicacao: 'desc' },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({
      id: r.id, escavadorDocId: r.escavadorDocId ?? null, chaveV2: r.chaveV2 ?? null, nome: r.nome,
      tipo: r.tipo, dataPublicacao: r.dataPublicacao ? r.dataPublicacao.toISOString().split('T')[0] : null,
      urlPublica: r.urlPublica, paginas: r.paginas, baixado: r.baixado, blobUrl: r.blobUrl,
    }))
  } catch { return [] }
}

// ─── Action 2 — Listar documentos salvos para uma nomeação ───────────────────

export async function listarDocumentosNomeacao(
  nomeacaoId: string,
): Promise<ProcessoDocumentoRow[]> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return []

  try {
    const nomeacao = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true, processoId: true },
    })
    if (!nomeacao || nomeacao.peritoId !== userId) return []

    const rows = await prisma.processoDocumento.findMany({
      where: { processoId: nomeacao.processoId },
      orderBy: { dataPublicacao: 'desc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({
      id:             r.id,
      escavadorDocId: r.escavadorDocId ?? null,
      chaveV2:        r.chaveV2 ?? null,
      nome:           r.nome,
      tipo:           r.tipo,
      dataPublicacao: r.dataPublicacao ? r.dataPublicacao.toISOString().split('T')[0] : null,
      urlPublica:     r.urlPublica,
      paginas:        r.paginas,
      baixado:        r.baixado,
      blobUrl:        r.blobUrl,
    }))
  } catch {
    return []
  }
}

// ─── Action: Buscar processos por nome do perito (sem CNJ) ───────────────────
//
// Usa Escavador v2 /envolvido/processos — encontra processos onde o perito
// foi nomeado, mesmo sem saber o número do processo de antemão.

export async function sugerirProcessosSemCNJ(
  periciaId: string,
): Promise<{ ok: true; processos: ProcessoSugestao[] } | { ok: false; error: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    // Verifica posse da perícia
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true },
    })
    if (!pericia || pericia.peritoId !== userId) return { ok: false, error: 'Perícia não encontrada' }

    // Nome do perito (User) + CPF (PeritoPerfil)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    const perfil = await prisma.peritoPerfil.findUnique({ where: { userId }, select: { cpf: true } })
    const nome = user?.name
    if (!nome) return { ok: false, error: 'Nome do perito não encontrado no perfil' }

    const escavador = radar as EscavadorService
    console.log('[sugerirProcessosSemCNJ] buscando por nome:', nome, '| cpf:', perfil?.cpf ?? 'não informado')
    const { citacoes, totalProcessos } = await escavador.buscarProcessosEnvolvido(nome, perfil?.cpf ?? null)
    console.log('[sugerirProcessosSemCNJ] total Escavador:', totalProcessos, '| após filtro:', citacoes.length)

    const processos: ProcessoSugestao[] = citacoes
      .filter((c) => c.numeroProcesso)
      .map((c) => {
        // snippet: "Perito nomeado no processo X | Orgao | Partes"
        const parts = c.snippet.split('|').map((s) => s.trim())
        const orgao = parts[1] ?? c.diarioNome
        const partes = parts[2] ?? ''
        return {
          cnj: c.numeroProcesso!,
          tribunal: c.diarioSigla,
          orgao,
          partes,
          dataUltMov: c.diarioData,
        }
      })

    return { ok: true, processos }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar processos' }
  }
}

// ─── Action: Vincular CNJ a uma perícia ──────────────────────────────────────

export async function vincularProcessoPericia(
  periciaId: string,
  cnj: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true },
    })
    if (!pericia || pericia.peritoId !== userId) return { ok: false, error: 'Perícia não encontrada' }

    await prisma.pericia.update({
      where: { id: periciaId },
      data: { processo: cnj },
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao vincular processo' }
  }
}
