import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AgendaList } from '@/components/agenda/agenda-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Agenda — PeriLaB' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // All agenda items for this perito, grouped by pericia
  const items = await prisma.agendaItem.findMany({
    where: { peritoId: userId },
    orderBy: [{ status: 'asc' }, { dataLimite: 'asc' }, { criadoEm: 'desc' }],
  })

  // Get pericia info for grouping
  const periciaIds = [...new Set(items.map((i) => i.periciaId))]
  const pericias = periciaIds.length > 0
    ? await prisma.pericia.findMany({
        where: { id: { in: periciaIds } },
        select: { id: true, numero: true, assunto: true, vara: true, status: true },
      })
    : []

  const periciasMap = new Map(pericias.map((p) => [p.id, p]))

  // Group items by pericia
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const list = grouped.get(item.periciaId) ?? []
    list.push(item)
    grouped.set(item.periciaId, list)
  }

  const groups = Array.from(grouped.entries()).map(([periciaId, agendaItems]) => {
    const pericia = periciasMap.get(periciaId)
    return {
      periciaId,
      periciaNumero: pericia?.numero ?? '—',
      periciaAssunto: pericia?.assunto ?? 'Perícia',
      periciaVara: pericia?.vara ?? null,
      periciaStatus: pericia?.status ?? 'planejada',
      items: agendaItems.map((i) => ({
        id: i.id,
        periciaId: i.periciaId,
        titulo: i.titulo,
        descricao: i.descricao,
        tipo: i.tipo,
        origem: i.origem,
        dataLimite: i.dataLimite?.toISOString() ?? null,
        status: i.status,
        prioridade: i.prioridade,
        criadoEm: i.criadoEm.toISOString(),
      })),
    }
  })

  const totalPending = items.filter((i) => i.status === 'pending').length
  const totalCompleted = items.filter((i) => i.status === 'completed').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda do Perito"
        description={`${totalPending} ação${totalPending !== 1 ? 'ões' : ''} pendente${totalPending !== 1 ? 's' : ''} · ${totalCompleted} concluída${totalCompleted !== 1 ? 's' : ''}`}
      />

      {groups.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">Nenhuma ação na agenda</p>
          <p className="text-xs text-slate-400 mt-1">
            Crie uma perícia e o sistema vai sugerir automaticamente as próximas ações.
          </p>
          <Link href="/pericias/nova" className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors">
            Nova perícia →
          </Link>
        </div>
      ) : (
        <AgendaList groups={groups} />
      )}
    </div>
  )
}
