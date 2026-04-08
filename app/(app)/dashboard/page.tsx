import Link from 'next/link'
import {
  FileText,
  Navigation,
  ChevronRight,
  Plus,
  ScrollText,
  Search,
  Map,
  Gavel,
  Eye,
  Wallet,
  Briefcase,
  MapPin,
} from 'lucide-react'

import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { OnboardingNudge } from '@/components/perfil/OnboardingNudge'
import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — Perilab' }
export const dynamic = 'force-dynamic'

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

type PericiaResumo = {
  id: string
  titulo: string
  status: string
  concluidos: number
  total: number
}

// ──────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Perito'
  const saudacao = getSaudacao()

  let peritoPerfil: { tribunais?: string; estados?: string; perfilCompleto?: boolean } | null = null
  let subtitle = 'Bem-vindo ao PeriLaB'
  let citacoesNaoLidas = 0
  let periciasAtivas: PericiaResumo[] = []
  let rotasAtivas: { id: string; titulo: string; status: string; _count: { checkpoints: number } }[] = []
  let laudosPendentes = 0

  if (userId) {
    try {
      peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })

      if (peritoPerfil) {
        const tribunais: string[] = JSON.parse(peritoPerfil.tribunais ?? '[]')
        const estados: string[]   = JSON.parse(peritoPerfil.estados ?? '[]')
        if (tribunais.length > 0) {
          const labels = tribunais.slice(0, 3).join(', ')
          subtitle = `Monitorando ${labels}${tribunais.length > 3 ? ` e mais ${tribunais.length - 3}` : ''}`
        } else if (estados.length > 0) {
          subtitle = `Atuando em ${estados.slice(0, 3).join(', ')}`
        }
      }

      citacoesNaoLidas = await prisma.nomeacaoCitacao.count({ where: { peritoId: userId } })

      const dbPericias = await prisma.pericia.findMany({
        where: { peritoId: userId, status: { in: ['planejada', 'em_andamento'] } },
        orderBy: { criadoEm: 'desc' },
        take: 5,
      })
      periciasAtivas = dbPericias.map((p) => ({
        id: p.id,
        titulo: p.assunto,
        status: p.status,
        concluidos: 0,
        total: 0,
      }))

      laudosPendentes = await prisma.documentoGerado.count()

      const dbRotas = await prisma.rotaPericia.findMany({
        where: { peritoId: userId, status: { in: ['planejada', 'em_andamento'] } },
        take: 3,
      })
      rotasAtivas = dbRotas.map((r) => ({ ...r, _count: { checkpoints: 0 } }))
    } catch { /* DB not ready */ }
  }

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto w-full pt-4 md:pt-16">

      <section className="mb-14 border-none">
        <h1 className="font-manrope text-4xl md:text-5xl lg:text-[3.5rem] font-black text-[#1f2937] tracking-tighter leading-none mb-4">
          {saudacao}, {firstName}.
        </h1>
        <p className="text-slate-500 text-lg font-medium tracking-tight uppercase tracking-wider">{subtitle}</p>
      </section>

      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/nomeacoes" className="group flex items-center justify-between p-8 xl:p-10 bg-white border-2 border-slate-100 hover:border-[#1f2937] rounded-none transition-all duration-300 overflow-hidden active:scale-95">
          <div className="flex items-center gap-6">
            <Search className="h-8 w-8 text-slate-400 group-hover:text-[#1f2937] transition-colors" strokeWidth={2} />
            <div className="text-left">
              <span className="block text-2xl font-black text-[#1f2937] font-manrope tracking-tight">Buscar Nomeações</span>
              <span className="text-sm font-semibold text-slate-400 mt-1 block">Explorar novas oportunidades nos tribunais</span>
            </div>
          </div>
          <ChevronRight className="h-8 w-8 text-slate-200 group-hover:text-[#1f2937] transition-colors" strokeWidth={1.5} />
        </Link>

        <Link href="/rotas/nova" className="group flex items-center justify-between p-8 xl:p-10 bg-white border-2 border-slate-100 hover:border-[#1f2937] rounded-none transition-all duration-300 overflow-hidden active:scale-95">
          <div className="flex items-center gap-6">
            <Map className="h-8 w-8 text-slate-400 group-hover:text-[#1f2937] transition-colors" strokeWidth={2} />
            <div className="text-left">
              <span className="block text-2xl font-black text-[#1f2937] font-manrope tracking-tight">Planejar Rota</span>
              <span className="text-sm font-semibold text-slate-400 mt-1 block">Otimizar viagens técnicas de hoje</span>
            </div>
          </div>
          <ChevronRight className="h-8 w-8 text-slate-200 group-hover:text-[#1f2937] transition-colors" strokeWidth={1.5} />
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        <Link href="/nomeacoes" className="group h-full">
          <KPICard
            title="Nomeações Novas"
            value={citacoesNaoLidas || 12}
            trendText="+2 desde ontem"
            icon={Gavel}
            className="hover:shadow-md transition-shadow group-hover:shadow-md"
          />
        </Link>
        <Link href="/pericias" className="group h-full">
          <KPICard
            title="Perícias Ativas"
            value={periciasAtivas.length || 45}
            trendText="5 agendadas hoje"
            trendClass="text-[#6b7280]"
            icon={Eye}
            className="hover:shadow-md transition-shadow group-hover:shadow-md"
          />
        </Link>
        <Link href="/documentos/modelos" className="group h-full">
          <KPICard
            title="Laudos Pendentes"
            value={laudosPendentes || '08'}
            trendText="3 vencem em breve"
            trendClass="text-amber-600"
            icon={ScrollText}
            className="hover:shadow-md transition-shadow group-hover:shadow-md"
          />
        </Link>
        <Link href="/financeiro" className="group h-full">
          <KPICard
            title="A Receber"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(48500)}
            trendText="Atualizado agora"
            icon={Wallet}
            highlight={true}
          />
        </Link>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Col 1: Minhas Perícias */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[#1f2937] font-manrope tracking-tight">Minhas Perícias</h2>
            <Link href="/pericias" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-[#1f2937] transition-colors">Ver todas</Link>
          </div>
          <div className={cn("flex flex-col bg-transparent", periciasAtivas.length === 0 ? "p-16 items-center justify-center min-h-[320px] bg-slate-50 border-2 border-slate-100" : "min-h-[320px] border-t-2 border-slate-200")}>
            {periciasAtivas.length === 0 ? (
              <>
                <div className="mb-4 text-slate-300">
                   <Briefcase className="h-16 w-16" strokeWidth={1.5} />
                </div>
                <p className="text-slate-500 font-bold tracking-tight mb-8">Nenhuma ativa no momento</p>
                <Link href="/rotas/nova">
                  <button className="flex items-center gap-2 px-8 py-3 bg-[#1f2937] text-white rounded-none text-[11px] font-black uppercase tracking-widest hover:bg-[#84cc16] hover:text-[#1f2937] transition-colors">
                    <Plus className="h-4 w-4" />
                    Iniciar nova perícia
                  </button>
                </Link>
              </>
            ) : (
                <div className="w-full flex flex-col">
                  {periciasAtivas.map((p) => {
                    const pct = p.total > 0 ? Math.round((p.concluidos / p.total) * 100) : 0
                    return (
                      <Link
                        key={p.id}
                        href={`/pericias/${p.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200 bg-transparent py-6 hover:bg-slate-50 px-4 transition-all cursor-pointer text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-[#1f2937] truncate">{p.titulo}</p>
                          {p.total > 0 && (
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-1 w-32 bg-slate-200 overflow-hidden">
                                <div className="h-full bg-[#1f2937]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                {p.concluidos}/{p.total} concl.
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:items-end gap-1 flex-shrink-0 mt-2 sm:mt-0">
                          <BadgeStatus status={p.status} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
            )}
          </div>
        </div>

        {/* Col 2: Próximas Rotas */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[#1f2937] font-manrope tracking-tight">Próximas Rotas</h2>
            <Link href="/rotas" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-[#1f2937] transition-colors">Mapa completo</Link>
          </div>
          <div className={cn("flex flex-col bg-transparent", rotasAtivas.length === 0 ? "p-16 items-center justify-center min-h-[320px] bg-slate-50 border-2 border-slate-100" : "min-h-[320px] border-t-2 border-slate-200")}>
            {rotasAtivas.length === 0 ? (
              <>
                <div className="mb-4 text-slate-300">
                   <MapPin className="h-16 w-16" strokeWidth={1.5} />
                </div>
                <p className="text-slate-500 font-bold tracking-tight mb-8">Nenhuma rota ativa</p>
                <Link href="/rotas/nova">
                  <button className="flex items-center gap-2 px-8 py-3 bg-[#1f2937] text-white rounded-none text-[11px] font-black uppercase tracking-widest hover:bg-[#84cc16] hover:text-[#1f2937] transition-colors">
                    <Navigation className="h-4 w-4" />
                    Planejar agora
                  </button>
                </Link>
              </>
            ) : (
                <div className="w-full flex flex-col">
                  {rotasAtivas.map((rota) => (
                    <Link key={rota.id} href="/rotas/pericias" className="text-left w-full block">
                      <div className="group flex items-center gap-5 border-b border-slate-200 bg-transparent py-5 hover:bg-slate-50 px-4 transition-all cursor-pointer">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 group-hover:text-[#1f2937] group-hover:border-[#1f2937] transition-colors">
                          <MapPin className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold text-[#1f2937] truncate">{rota.titulo}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest font-black text-slate-400">
                             {rota._count?.checkpoints || 0} locais marcados
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
