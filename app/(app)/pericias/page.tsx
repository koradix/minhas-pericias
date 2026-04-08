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

export const metadata: Metadata = { title: 'Pericias' }

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
        title="Pericias"
        description={`${dbPericias.length} perícia${dbPericias.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/pericias/nova">
              <Button size="sm" variant="outline" className="font-semibold rounded-lg px-4 h-10 gap-1.5">
                <Plus className="h-4 w-4" /> Nova perícia
              </Button>
            </Link>
            <Link href="/nomeacoes">
              <Button size="sm" className="bg-[#416900] hover:bg-[#345300] text-white font-semibold rounded-lg px-6 h-10 gap-1.5 transition-colors border border-transparent shadow-sm">
                Ver nomeações <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Pericias (primary) ── */}
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
        <div className="grid grid-cols-1 gap-4">
          {dbPericias.map((p) => {
            const st = statusPericiaMap[p.status] ?? { label: p.status, variant: 'secondary' as const }
            return (
              <Link href={`/pericias/${p.id}`} key={p.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white border border-slate-200 rounded-xl p-6 hover:border-[#416900]/30 hover:shadow-md transition-all">
                  
                <div className="flex items-start gap-5">
                  <div className="flex mt-0.5 h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-[#416900]/5 text-slate-400 group-hover:text-[#416900] transition-colors">
                    <FileText className="h-6 w-6" strokeWidth={1} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[17px] sm:text-[19px] font-bold text-slate-900 font-manrope leading-tight mb-2 group-hover:text-[#416900] transition-colors">{p.assunto}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-500 font-medium">
                      <span className="font-mono text-slate-400 font-semibold">{p.numero}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="truncate max-w-[280px]">
                        {p.rotaTitulo ? <span className="text-[#416900] font-bold flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Rota: {p.rotaTitulo}</span> : p.vara ?? 'Vara não informada'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 border-t sm:border-t-0 border-slate-100 pt-5 sm:pt-0">
                  {p.prazo && (
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Prazo</span>
                      <span className="flex items-center gap-1.5 text-[15px] font-bold text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400" /> {p.prazo}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-start sm:items-end ml-auto sm:ml-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-sm",
                        st.variant === 'success' ? 'bg-emerald-500' :
                        st.variant === 'warning' ? 'bg-amber-500' :
                        st.variant === 'info' ? 'bg-blue-500' : 'bg-slate-400'
                      )} />
                      <span className="text-[15px] font-bold text-slate-900 tracking-tight">{st.label}</span>
                    </div>
                  </div>
                </div>
                  
              </Link>
            )
          })}
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

          <div className="grid grid-cols-1 gap-4">
            {rotas.map((rota) => (
              <Link href={`/pericias/${rota.id}`} key={rota.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white border border-slate-200 rounded-xl p-6 hover:border-[#416900]/30 hover:shadow-md transition-all">
                
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "flex mt-0.5 h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-colors",
                    rota.status === 'concluida' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-[#416900]/5 group-hover:text-[#416900]'
                  )}>
                    {rota.status === 'concluida'
                      ? <CheckCircle2 className="h-6 w-6" strokeWidth={1} />
                      : <Navigation className="h-6 w-6" strokeWidth={1} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[17px] sm:text-[19px] font-bold text-slate-900 font-manrope leading-tight mb-2 group-hover:text-[#416900] transition-colors">{rota.titulo}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-500 font-medium">
                      <span className="font-mono text-slate-400 font-semibold">{rota.id.slice(-8).toUpperCase()}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>Criada em {new Date(rota.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 border-t sm:border-t-0 border-slate-100 pt-5 sm:pt-0">
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Progresso</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", rota.status === 'concluida' ? "bg-emerald-500" : "bg-[#416900]")}
                          style={{ width: rota.total > 0 ? `${Math.round((rota.concluidos / rota.total) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[14px] font-bold text-slate-500 tabular-nums">
                        {rota.concluidos}/{rota.total}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start sm:items-end ml-auto sm:ml-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-sm",
                        rota.status === 'concluida' ? 'bg-emerald-500' :
                        rota.status === 'cancelada' ? 'bg-slate-400' : 'bg-blue-500'
                      )} />
                      <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                        {rota.status === 'concluida' ? 'Concluída' : rota.status === 'cancelada' ? 'Cancelada' : 'Em andamento'}
                      </span>
                    </div>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
