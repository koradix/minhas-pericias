'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { searchByName } from '@/lib/services/datajud'
import { getDataJudAlias } from '@/lib/constants/datajud-tribunais'
import { calcularScore } from '@/lib/utils/match-nomeacao'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuscarDataJudResult =
  | { ok: true; novas: number; atualizadas: number }
  | { ok: false; error: string }

// ─── Action 1 — Buscar processos no DataJud ───────────────────────────────────

export async function buscarProcessosDataJud(): Promise<BuscarDataJudResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  const nome = session.user?.name ?? ''
  if (!nome.trim()) return { ok: false, error: 'Nome do perito não configurado no perfil' }

  // ── 1. Carregar perfil ──────────────────────────────────────────────────────
  let peritoPerfil = null
  try {
    peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Erro ao carregar perfil: ${msg}` }
  }

  if (!peritoPerfil) return { ok: false, error: 'Perfil não encontrado. Complete seu cadastro.' }

  const siglas: string[] = JSON.parse(peritoPerfil.tribunais ?? '[]')
  if (siglas.length === 0) return { ok: false, error: 'Nenhum tribunal cadastrado no perfil. Vá em Configurações → Tribunais.' }

  // ── 2. Verificar se tabelas Processo/Nomeacao existem no banco ──────────────
  try {
    await prisma.processo.count()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Tabela Processo não encontrada no banco. Execute a migração SQL no Turso. Detalhe: ${msg}` }
  }

  // ── 3. Buscar no DataJud ────────────────────────────────────────────────────
  const perfil = {
    especialidades:  JSON.parse(peritoPerfil.especialidades  ?? '[]') as string[],
    especialidades2: JSON.parse((peritoPerfil as { especialidades2?: string }).especialidades2 ?? '[]') as string[],
    areaPrincipal:   (peritoPerfil as { areaPrincipal?: string | null }).areaPrincipal ?? null,
    tribunais:       siglas,
    estados:         JSON.parse((peritoPerfil as { estados?: string }).estados ?? '[]') as string[],
    cursos:          JSON.parse(peritoPerfil.cursos ?? '[]') as string[],
    perfilCompleto:  Boolean((peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto),
  }

  const siglasComAlias = siglas.filter((s) => getDataJudAlias(s) !== undefined)
  if (siglasComAlias.length === 0) {
    return { ok: false, error: `Nenhum dos seus tribunais é suportado (${siglas.join(', ')}). Adicione um tribunal estadual (TJSP, TJRJ, etc.)` }
  }

  const resultadosPorTribunal = await Promise.all(
    siglasComAlias.map(async (sigla) => {
      const alias = getDataJudAlias(sigla)!
      const processos = await searchByName(nome, alias, 60)
      return processos.map((p) => ({ ...p, tribunal: sigla }))
    })
  )

  const todosProcessos = resultadosPorTribunal.flat()

  if (todosProcessos.length === 0) {
    // Atualiza timestamp mesmo sem resultados
    try {
      await prisma.radarConfig.upsert({
        where: { peritoId: userId },
        create: { peritoId: userId, tribunaisMonitorados: JSON.stringify(siglas), ultimaBusca: new Date() },
        update: { ultimaBusca: new Date() },
      })
    } catch { /* non-blocking */ }
    revalidatePath('/nomeacoes')
    return { ok: true, novas: 0, atualizadas: 0 }
  }

  // Dedup por numeroProcesso
  const seen = new Set<string>()
  const unique = todosProcessos.filter((p) => {
    if (seen.has(p.numeroProcesso)) return false
    seen.add(p.numeroProcesso)
    return true
  })

  // ── 4. Salvar no banco ──────────────────────────────────────────────────────
  let novas = 0
  let atualizadas = 0
  let dbError: string | null = null

  for (const proc of unique) {
    const score = calcularScore(proc, perfil)

    try {
      const processo = await prisma.processo.upsert({
        where: { numeroProcesso: proc.numeroProcesso },
        create: {
          numeroProcesso: proc.numeroProcesso,
          tribunal: proc.tribunal,
          classe: proc.classe,
          assunto: proc.assunto,
          orgaoJulgador: proc.orgaoJulgador,
          dataDistribuicao: proc.dataDistribuicao,
          dataUltimaAtu: proc.dataUltimaAtu,
          partes: JSON.stringify(proc.partes),
        },
        update: {
          tribunal: proc.tribunal,
          classe: proc.classe,
          assunto: proc.assunto,
          orgaoJulgador: proc.orgaoJulgador,
          dataUltimaAtu: proc.dataUltimaAtu,
          partes: JSON.stringify(proc.partes),
        },
      })

      const existing = await prisma.nomeacao.findUnique({
        where: { peritoId_processoId: { peritoId: userId, processoId: processo.id } },
      })

      if (!existing) {
        await prisma.nomeacao.create({
          data: { peritoId: userId, processoId: processo.id, scoreMatch: score, status: 'novo' },
        })
        novas++
      } else {
        await prisma.nomeacao.update({
          where: { id: existing.id },
          data: { scoreMatch: score },
        })
        atualizadas++
      }
    } catch (e) {
      // Captura o primeiro erro de DB para reportar
      if (!dbError) dbError = e instanceof Error ? e.message : String(e)
    }
  }

  // Se salvou ZERO e houve erro, reporta o erro de DB
  if (novas === 0 && atualizadas === 0 && dbError) {
    return { ok: false, error: `DataJud retornou ${unique.length} processo(s) mas falhou ao salvar: ${dbError}` }
  }

  try {
    await prisma.radarConfig.upsert({
      where: { peritoId: userId },
      create: { peritoId: userId, tribunaisMonitorados: JSON.stringify(siglas), ultimaBusca: new Date() },
      update: { ultimaBusca: new Date() },
    })
  } catch { /* non-blocking */ }

  revalidatePath('/nomeacoes')
  return { ok: true, novas, atualizadas }
}

// ─── Action 2 — Atualizar status de uma nomeação ──────────────────────────────

export async function atualizarStatusNomeacao(
  nomeacaoId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  const validStatuses = ['novo', 'proposta', 'em_andamento', 'laudo', 'entregue', 'arquivado']
  if (!validStatuses.includes(status)) return { ok: false, error: 'Status inválido' }

  try {
    await prisma.nomeacao.updateMany({
      where: { id: nomeacaoId, peritoId: userId },
      data: { status },
    })
    revalidatePath('/nomeacoes')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao atualizar' }
  }
}
