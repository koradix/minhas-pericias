import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Navigation, Plus, CheckCircle2, Clock, FileText,
  ArrowRight, Inbox,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Péricias' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

const statusPericiaMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' | 'danger' }> = {
  planejada:          { label: 'Planejada',          variant: 'info'      },
  processo_importado: { label: 'Processo importado', variant: 'info'      },
  em_andamento:       { label: 'Em andamento',       variant: 'warning'   },
  concluida:          { label: 'Concluída',          variant: 'success'   },
  cancelada:          { label: 'Cancelada',          variant: 'secondary' },
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

    // Enrich péricias with rota info if linked via checkpoint
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
  } catch { /* DB not ready — empty */ }

  return (
    <div className="space-y-8 p-4 md:p-12 max-w-7xl mx-auto w-full pt-4 md:pt-16">
      <PageHeader
        title="Péricias"
        description={`${dbPericias.length} perícia${dbPericias.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/nomeacoes">
            <Button size="sm" className="bg-[#416900] hover:bg-[#345300] text-white font-semibold rounded-lg px-6 h-10 gap-1.5 transition-colors border border-transparent shadow-sm">
              <Plus className="h-4 w-4" /> Ver nomeações
            </Button>
          </Link>
        }
      />

      {/* ── Péricias (primary) ── */}
      {dbPericias.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-[#e2e8f0] rounded-xl text-center min-h-[320px]">
          <div className="mb-4 text-[#e2e8f0]">
            <Inbox className="h-[72px] w-[72px]" strokeWidth={1} />
          </div>
          <p className="text-xl font-bold text-[#1f2937] font-manrope mb-2">Nenhuma perícia ainda</p>
          <p className="text-sm text-[#6b7280] font-medium mb-8 max-w-sm">
            Importe um processo a partir de uma nomeação para criar a primeira perícia.
          </p>
          <Link href="/nomeacoes">
            <button className="flex items-center gap-2 px-6 py-2 border border-[#416900] text-[#416900] rounded-lg text-sm font-semibold hover:bg-[#416900]/5 transition-colors">
              Ver nomeações <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    Processo / Descrição
                  </th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    Vara
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    Prazo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {dbPericias.map((p) => {
                  const st = statusPericiaMap[p.status] ?? { label: p.status, variant: 'secondary' as const }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/pericias/${p.id}`} className="flex items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white text-slate-400 group-hover:text-[#416900] transition-colors">
                            <FileText className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1f2937] truncate">{p.assunto}</p>
                            <p className="text-xs text-[#6b7280] font-mono mt-0.5">{p.numero}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <p className="text-xs text-[#6b7280] font-medium truncate max-w-xs">
                          {p.rotaTitulo
                            ? <span className="text-[#416900] font-semibold">{p.rotaTitulo}</span>
                            : p.vara ?? '—'
                          }
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={st.variant} className="font-semibold shadow-none border-transparent">{st.label}</Badge>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        {p.prazo && (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-[#6b7280]">
                            <Clock className="h-4 w-4 text-slate-400" /> {p.prazo}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#e2e8f0] bg-slate-50/50 px-6 py-4">
            <p className="text-xs font-semibold text-[#6b7280]">
              Mostrando {dbPericias.length} perícia{dbPericias.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Rotas de vistoria (secondary) ── */}
      {rotas.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1f2937] font-manrope">
              Rotas de vistoria
            </h2>
            <Link href="/rotas/pericias" className="text-sm font-medium text-[#416900] hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                      Rota
                    </th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                      Progresso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {rotas.map((rota) => (
                    <tr key={rota.id} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/pericias/${rota.id}`} className="flex items-center gap-4">
                          <div className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border',
                            rota.status === 'concluida' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-white group-hover:text-[#416900]'
                          )}>
                            {rota.status === 'concluida'
                              ? <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                              : <Navigation className="h-5 w-5" strokeWidth={1.5} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1f2937] truncate">{rota.titulo}</p>
                            <p className="text-xs text-[#6b7280] font-mono mt-0.5">{rota.id.slice(-8).toUpperCase()}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#416900]"
                              style={{ width: rota.total > 0 ? `${Math.round((rota.concluidos / rota.total) * 100)}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#6b7280] tabular-nums">
                            {rota.concluidos}/{rota.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rota.status === 'concluida'
                          ? <Badge variant="success" className="font-semibold shadow-none border-transparent">Concluída</Badge>
                          : rota.status === 'cancelada'
                            ? <Badge variant="secondary" className="font-semibold shadow-none border-transparent">Cancelada</Badge>
                            : <Badge variant="info" className="font-semibold shadow-none border-transparent">Em andamento</Badge>}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <span className="text-sm font-medium text-[#6b7280]">
                          {new Date(rota.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
