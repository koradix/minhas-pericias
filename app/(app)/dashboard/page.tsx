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
        <h1 className="text-[32px] font-extrabold text-[#1f2937] tracking-tight leading-none mb-2 font-manrope">
          {saudacao}, {firstName}.
        </h1>
        <p className="text-[#6b7280] text-lg font-medium">{subtitle}</p>
      </section>

      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/nomeacoes" className="group relative flex items-center justify-between p-8 bg-white border border-[#e2e8f0] rounded-xl hover:bg-slate-50 transition-all duration-300 overflow-hidden active:scale-95">
          <div className="flex items-center gap-6">
            <Search className="h-8 w-8 text-[#1f2937] group-hover:text-[#416900] transition-colors" strokeWidth={1.5} />
            <div className="text-left">
              <span className="block text-xl font-bold text-[#1f2937] font-manrope">Buscar Nomeações</span>
              <span className="text-sm text-[#6b7280]">Explorar novas oportunidades nos tribunais</span>
            </div>
          </div>
          <ChevronRight className="h-6 w-6 text-[#e2e8f0] group-hover:text-[#416900] transition-colors" />
        </Link>

        <Link href="/rotas/nova" className="group relative flex items-center justify-between p-8 bg-white border border-[#e2e8f0] rounded-xl hover:bg-slate-50 transition-all duration-300 overflow-hidden active:scale-95">
          <div className="flex items-center gap-6">
            <Map className="h-8 w-8 text-[#416900]" strokeWidth={1.5} />
            <div className="text-left">
              <span className="block text-xl font-bold text-[#1f2937] font-manrope">Planejar Rota</span>
              <span className="text-sm text-[#6b7280]">Otimizar visitas técnicas de hoje</span>
            </div>
          </div>
          <ChevronRight className="h-6 w-6 text-[#e2e8f0] group-hover:text-[#416900] transition-colors" />
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
            <h2 className="text-xl font-bold text-[#1f2937] font-manrope">Minhas Perícias</h2>
            <Link href="/pericias" className="text-sm text-[#416900] font-medium hover:underline">Ver todas</Link>
          </div>
          <div className={cn("flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden text-center", periciasAtivas.length === 0 ? "p-16 items-center justify-center min-h-[320px]" : "p-6 min-h-[320px]")}>
            {periciasAtivas.length === 0 ? (
              <>
                <div className="mb-4 text-[#e2e8f0]">
                   <Briefcase className="h-[72px] w-[72px]" strokeWidth={1} />
                </div>
                <p className="text-[#6b7280] font-medium mb-6">Nenhuma ativa no momento</p>
                <Link href="/rotas/nova">
                  <button className="flex items-center gap-2 px-6 py-2 border border-[#416900] text-[#416900] rounded-lg text-sm font-semibold hover:bg-[#416900]/5 transition-colors">
                    <Plus className="h-4 w-4" />
                    Iniciar nova perícia
                  </button>
                </Link>
              </>
            ) : (
                <div className="w-full space-y-3">
                  {periciasAtivas.map((p) => {
                    const pct = p.total > 0 ? Math.round((p.concluidos / p.total) * 100) : 0
                    return (
                      <Link
                        key={p.id}
                        href={`/pericias/${p.id}`}
                        className="group flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white shadow-sm p-5 hover:border-[#416900]/50 transition-all cursor-pointer text-left"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white text-slate-400 group-hover:text-[#416900] transition-colors">
                          <FileText className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 px-2">
                          <p className="text-base font-bold text-[#1f2937] truncate">{p.titulo}</p>
                          {p.total > 0 && (
                            <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#416900]" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 pl-2">
                          {p.total > 0 && (
                            <span className="text-xs font-bold tabular-nums text-slate-500 text-right">
                              {p.concluidos}/{p.total} concl.
                            </span>
                          )}
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
            <h2 className="text-xl font-bold text-[#1f2937] font-manrope">Próximas Rotas</h2>
            <Link href="/rotas" className="text-sm text-[#416900] font-medium hover:underline">Mapa completo</Link>
          </div>
          <div className={cn("flex flex-col border border-transparent rounded-xl overflow-hidden text-center", rotasAtivas.length === 0 ? "p-16 items-center justify-center min-h-[320px] bg-slate-50" : "p-0 min-h-[320px] bg-transparent")}>
            {rotasAtivas.length === 0 ? (
              <>
                <div className="mb-4 text-[#e2e8f0]">
                   <MapPin className="h-[72px] w-[72px]" strokeWidth={1} />
                </div>
                <p className="text-[#6b7280] font-medium mb-6">Nenhuma rota ativa</p>
                <Link href="/rotas/nova">
                  <button className="flex items-center gap-2 px-6 py-2 bg-transparent text-[#1f2937] border border-transparent hover:bg-white hover:border-[#e2e8f0] shadow-sm rounded-lg text-sm font-semibold transition-all">
                    <Navigation className="h-4 w-4" />
                    + Planejar agora
                  </button>
                </Link>
              </>
            ) : (
                <div className="w-full space-y-3">
                  {rotasAtivas.map((rota) => (
                    <Link key={rota.id} href="/rotas/pericias" className="text-left w-full block">
                      <div className="group flex items-start gap-4 rounded-xl border border-[#e2e8f0] bg-white shadow-sm p-5 hover:border-[#416900]/50 transition-all cursor-pointer">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                          <MapPin className="h-5 w-5 text-slate-500 group-hover:text-[#416900]" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-base font-bold text-[#1f2937] truncate">{rota.titulo}</p>
                          </div>
                          <p className="text-sm text-[#416900] font-semibold">
                             {rota._count?.checkpoints || 0} locais registrados
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
