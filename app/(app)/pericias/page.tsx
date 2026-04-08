import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { BadgeStatus } from '@/components/shared/badge-status'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pericias — Perilab' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

export default async function PericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  type RotaRow = { id: string; titulo: string; status: string; criadoEm: string; concluidos: number; total: number }
  type PericiaRow = { id: string; numero: string; assunto: string; tipo: string; status: string; prazo: string | null; vara: string | null; rotaTitulo?: string }

  let rotas: RotaRow[] = []
  let dbPericias: PericiaRow[] = []

  try {
    const [dbRotas, pericias] = await Promise.all([
      prisma.rotaPericia.findMany({
        where: { peritoId: userId },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.pericia.findMany({
        where: { peritoId: userId },
        orderBy: { criadoEm: 'desc' },
        select: { id: true, numero: true, assunto: true, tipo: true, status: true, prazo: true, vara: true },
      }),
    ])

    if (dbRotas.length > 0) {
      const rotaIds = dbRotas.map((r) => r.id)
      const cps = await prisma.checkpoint.findMany({
        where: { rotaId: { in: rotaIds } },
        select: { rotaId: true, status: true },
      })
      rotas = dbRotas.map((rota) => {
        const mine = cps.filter((c) => c.rotaId === rota.id)
        return {
          id: rota.id,
          titulo: rota.titulo,
          status: rota.status,
          criadoEm: toISO(rota.criadoEm),
          concluidos: mine.filter((c) => c.status === 'concluido').length,
          total: mine.length,
        }
      })
    }

    if (pericias.length > 0 && rotas.length > 0) {
      const periciaIds = pericias.map((p) => p.id)
      const linkedCps = await prisma.checkpoint.findMany({
        where: { periciaId: { in: periciaIds } },
        select: { periciaId: true, rotaId: true },
      }).catch(() => [])
      const rotaMap = new Map(rotas.map((r) => [r.id, r.titulo]))
      const periciaRotaMap = new Map(linkedCps.map((c) => [c.periciaId!, rotaMap.get(c.rotaId)]))
      dbPericias = pericias.map((p) => ({ ...p, rotaTitulo: periciaRotaMap.get(p.id) }))
    } else {
      dbPericias = pericias.map((p) => ({ ...p }))
    }
  } catch { /* DB not ready */ }

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto w-full pt-10 md:pt-20 space-y-24 pb-32">
      <PageHeader
        title="PERÍCIAS"
        description={`${dbPericias.length} OPERAÇÕES ATIVAS`}
        actions={
          <>
            <Link href="/pericias/gestao">
              <Button size="md" variant="outline" className="border-r border-slate-100 uppercase tracking-widest text-[10px]">
                NOVA PERÍCIA
              </Button>
            </Link>
            <Link href="/nomeacoes">
              <Button size="md" variant="brand" className="uppercase tracking-widest text-[10px]">
                BUSCAR NOMEAÇÕES
              </Button>
            </Link>
          </>
        }
      />

      {dbPericias.length === 0 ? (
        <div className="p-20 bg-slate-50 flex flex-col items-center justify-center text-center border border-slate-100 min-h-[320px]">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] mb-8">Nenhuma operação ativa</p>
          <Link href="/nomeacoes">
            <button className="bg-slate-900 text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#a3e635] hover:text-slate-900 transition-all">
              Buscando Nomeações
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
          {dbPericias.map((p) => (
            <Link href={`/pericias/${p.id}`} key={p.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-white p-8 hover:bg-slate-50 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">{p.numero}</p>
                <p className="text-lg font-bold text-slate-900 uppercase tracking-tight group-hover:translate-x-1 transition-transform duration-300">{p.assunto}</p>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <span className="text-[10px] font-bold text-[#4d7c0f] uppercase tracking-widest">
                    {p.rotaTitulo ? `ROTA: ${p.rotaTitulo.toUpperCase()}` : (p.vara?.toUpperCase() ?? 'VARA NÃO INFORMADA')}
                  </span>
                  {p.prazo && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      PRAZO: {p.prazo.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <BadgeStatus status={p.status} className="shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {rotas.length > 0 && (
        <div className="pt-8 space-y-10">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">ROTAS DE VISTORIA</h2>
            <Link href="/rotas" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">VER MAPA →</Link>
          </div>

          <div className="grid grid-cols-1 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
            {rotas.map((rota) => (
              <Link href={`/pericias/${rota.id}`} key={rota.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-white p-8 hover:bg-slate-50 transition-all">
                <div className="min-w-0 flex-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">ID: {rota.id.slice(-8).toUpperCase()}</p>
                   <p className="text-lg font-bold text-slate-900 uppercase tracking-tight group-hover:translate-x-1 transition-transform duration-300">{rota.titulo.toUpperCase()}</p>
                   <div className="flex items-center gap-4 mt-6">
                     <div className="w-24 h-1 bg-slate-100 overflow-hidden">
                       <div className="h-full bg-[#a3e635] transition-all" style={{ width: rota.total > 0 ? `${Math.round((rota.concluidos / rota.total) * 100)}%` : '0%' }} />
                     </div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{rota.concluidos}/{rota.total} CHECKPOINTS</span>
                   </div>
                </div>
                <BadgeStatus status={rota.status} className="shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
