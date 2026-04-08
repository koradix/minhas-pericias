import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDemandas } from '@/lib/data/parceiro-demandas'
import { getPropostas } from '@/lib/data/propostas'
import { cn, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — Parceiro' }

export default async function ParceiroDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const [demandas, propostas] = await Promise.all([
    getDemandas(userId),
    getPropostas(userId),
  ])

  const demandasAbertas = demandas.filter((d) => d.status === 'aberta').length
  const propostasEnviadas = propostas.filter((p) => p.status === 'enviada' || p.status === 'visualizada').length
  const propostasAceitas = propostas.filter((p) => p.status === 'aceita').length

  const propostasRespondidas = propostas.filter((p) =>
    ['aceita', 'recusada', 'concluida'].includes(p.status)
  )
  const tempoMedioHoras = propostasRespondidas.length > 0
    ? Math.round(
        propostasRespondidas.reduce((acc, p) => {
          return acc + (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60)
        }, 0) / propostasRespondidas.length
      )
    : null
  const tempoMedioLabel = tempoMedioHoras === null ? '—'
    : tempoMedioHoras < 24 ? `${tempoMedioHoras}H`
    : `${Math.round(tempoMedioHoras / 24)}D`

  const demandasRecentes = demandas.slice(0, 3)
  const propostasRecentes = propostas.slice(0, 3)

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto w-full pt-10 md:pt-20 space-y-16 pb-32">
      <Section className="border-none">
        <PageHeader
          title="PAINEL PARCEIRO"
          description={`BEM-VINDO, ${session.user.name?.toUpperCase() ?? 'PARCEIRO'}. GESTÃO DE OPERAÇÕES.`}
          actions={
            <Link href="/parceiro/demandas/nova">
              <Button size="md" variant="brand">
                NOVA DEMANDA
              </Button>
            </Link>
          }
        />
      </Section>

      {/* KPIs — Atelier Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="DEMANDAS ABERTAS"
          value={demandasAbertas}
          subtitle="AGUARDANDO PERITOS"
          highlight
        />
        <KPICard
          title="PROPOSTAS ENVIADAS"
          value={propostasEnviadas}
          subtitle="AGUARDANDO RESPOSTA"
        />
        <KPICard
          title="PROPOSTAS ACEITAS"
          value={propostasAceitas}
          subtitle="PERITOS CONFIRMADOS"
        />
        <KPICard
          title="TEMPO MÉDIO"
          value={tempoMedioLabel}
          subtitle="PADRÃO DE RESPOSTA"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Demandas recentes */}
        <div className="space-y-10">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest leading-none">Minhas Demandas</h2>
            <Link href="/parceiro/demandas" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Todas →</Link>
          </div>
          
          <div className="flex flex-col min-h-[320px]">
            {demandasRecentes.length === 0 ? (
              <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center flex-1">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-8">Nenhuma demanda ativa</p>
                <Link href="/parceiro/demandas/nova">
                  <button className="bg-slate-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#a3e635] hover:text-slate-900 transition-all">
                    Criar primeira demanda
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
                {demandasRecentes.map((d) => (
                  <div key={d.id} className="group flex items-center justify-between gap-6 bg-white p-6 hover:bg-slate-50 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate group-hover:translate-x-1 transition-transform">{d.titulo}</p>
                      <div className="flex items-center gap-6 mt-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        <span>{d.cidade}/{d.uf}</span>
                        <span>{d.tipo}</span>
                        {d.valor > 0 && <span className="text-[#4d7c0f]">{formatCurrency(d.valor)}</span>}
                      </div>
                    </div>
                    <BadgeStatus status={d.status} className="shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Propostas recentes */}
        <div className="space-y-10">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest leading-none">Propostas Recebidas</h2>
            <Link href="/parceiro/propostas" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Todas →</Link>
          </div>

          <div className="flex flex-col min-h-[320px]">
            {propostasRecentes.length === 0 ? (
              <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center flex-1">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-8">Nenhuma proposta recebida</p>
                <Link href="/parceiro/peritos">
                  <button className="bg-[#a3e635] text-slate-900 px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all">
                    Buscar peritos
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
                {propostasRecentes.map((p) => (
                  <div key={p.id} className="group flex items-center justify-between gap-6 bg-white p-6 hover:bg-slate-50 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:translate-x-1 transition-transform">{p.peritoNome}</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">{p.demandaTitulo.toUpperCase()}</p>
                      {p.valorProposto && (
                        <p className="text-[9px] font-bold text-[#4d7c0f] uppercase tracking-widest mt-2">
                          LANCE: {formatCurrency(p.valorProposto)}
                        </p>
                      )}
                    </div>
                    <BadgeStatus status={p.status} className="shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ children, className }: { children: React.ReactNode, className?: string }) {
  return <section className={cn("mb-14", className)}>{children}</section>
}
