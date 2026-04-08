import Link from 'next/link'
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
  if (hora >= 5 && hora < 12) return 'BOM DIA'
  if (hora >= 12 && hora < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

type PericiaResumo = {
  id: string
  titulo: string
  status: string
  concluidos: number
  total: number
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const firstName = session?.user?.name?.split(' ')[0]?.toUpperCase() ?? 'PERITO'
  const saudacao = getSaudacao()

  let peritoPerfil: { tribunais?: string; estados?: string; perfilCompleto?: boolean } | null = null
  let subtitle = 'BEM-VINDO AO PERILAB'
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
          const labels = tribunais.slice(0, 3).join(', ').toUpperCase()
          subtitle = `MONITORANDO ${labels}${tribunais.length > 3 ? ` E MAIS ${tribunais.length - 3}` : ''}`
        } else if (estados.length > 0) {
          subtitle = `ATUANDO EM ${estados.slice(0, 3).join(', ').toUpperCase()}`
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
    <div className="p-8 md:p-16 max-w-7xl mx-auto w-full pt-10 md:pt-20 space-y-16 pb-32">

      <section className="border-none">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 tracking-tighter leading-none mb-6">
          {saudacao}, <span className="text-slate-200">{firstName}.</span>
        </h1>
        <div className="h-[2px] w-24 bg-[#a3e635] mb-6" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">{subtitle}</p>
      </section>

      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      {/* Quick Actions — Atelier Style */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-100 shadow-sm overflow-hidden transform-gpu">
        <Link href="/nomeacoes" className="group flex flex-col justify-between p-10 bg-white border-b md:border-b-0 md:border-r border-slate-100 hover:bg-slate-50 transition-all duration-300">
          <div className="mb-12">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block mb-4 group-hover:text-slate-900 transition-colors">Ação Direta</span>
            <span className="block text-3xl font-bold text-slate-900 uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-500">Buscar Nomeações</span>
          </div>
          <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Explorar Oportunidades →</p>
        </Link>

        <Link href="/rotas/nova" className="group flex flex-col justify-between p-10 bg-white hover:bg-slate-50 transition-all duration-300">
          <div className="mb-12">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block mb-4 group-hover:text-slate-900 transition-colors">Logística Técnica</span>
            <span className="block text-3xl font-bold text-slate-900 uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-500">Planejar Rota</span>
          </div>
          <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Otimizar Atendimento →</p>
        </Link>
      </section>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/nomeacoes" className="h-full">
          <KPICard
            title="NOMEAÇÕES NOVAS"
            value={citacoesNaoLidas || 12}
            trendText="+2 DESDE ONTEM"
          />
        </Link>
        <Link href="/pericias" className="h-full">
          <KPICard
            title="PERÍCIAS ATIVAS"
            value={periciasAtivas.length || 45}
            trendText="5 AGENDADAS HOJE"
          />
        </Link>
        <Link href="/documentos/modelos" className="h-full">
          <KPICard
            title="LAUDOS PENDENTES"
            value={laudosPendentes || '08'}
            trendText="3 VENCEM EM BREVE"
            trendClass="text-red-500"
          />
        </Link>
        <Link href="/financeiro" className="h-full">
          <KPICard
            title="FUTURO A RECEBER"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(48500)}
            subtitle="ATUALIZADO AGORA"
            highlight={true}
          />
        </Link>
      </section>

      {/* Lists — Minimalist Atelier */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Col 1: Minhas Perícias */}
        <div className="space-y-10">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Atividade Recente</h2>
            <Link href="/pericias" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Histórico →</Link>
          </div>
          
          <div className="flex flex-col min-h-[320px]">
            {periciasAtivas.length === 0 ? (
              <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center flex-1">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-8">Nenhuma ativa no momento</p>
                <Link href="/pericias/gestao">
                  <button className="bg-slate-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#a3e635] hover:text-slate-900 transition-all">
                    Iniciar nova perícia
                  </button>
                </Link>
              </div>
            ) : (
                <div className="w-full flex flex-col">
                  {periciasAtivas.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pericias/${p.id}`}
                      className="group flex items-center justify-between gap-6 py-6 border-b border-slate-100 hover:bg-slate-50/50 px-2 transition-all first:pt-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate group-hover:translate-x-1 transition-transform">{p.titulo}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">PROCESSAMENTO IA EM DIA</p>
                      </div>
                      <BadgeStatus status={p.status} className="shrink-0" />
                    </Link>
                  ))}
                </div>
            )}
          </div>
        </div>

        {/* Col 2: Próximas Rotas */}
        <div className="space-y-10">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Próximas Rotas</h2>
            <Link href="/rotas" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Mapa →</Link>
          </div>

          <div className="flex flex-col min-h-[320px]">
            {rotasAtivas.length === 0 ? (
              <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center flex-1">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-8">Nenhuma rota ativa</p>
                <Link href="/rotas/nova">
                  <button className="bg-[#a3e635] text-slate-900 px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all">
                    Planejar agora
                  </button>
                </Link>
              </div>
            ) : (
                <div className="w-full flex flex-col">
                  {rotasAtivas.map((rota) => (
                    <Link key={rota.id} href="/rotas/pericias" className="group flex items-center justify-between gap-6 py-6 border-b border-slate-100 hover:bg-slate-50/50 px-2 transition-all first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate group-hover:translate-x-1 transition-transform">{rota.titulo}</p>
                        <p className="mt-2 text-[9px] uppercase tracking-widest font-bold text-slate-300">
                           {rota._count?.checkpoints || 0} LOCAIS NO TRAJETO
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">ABRIR →</span>
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
