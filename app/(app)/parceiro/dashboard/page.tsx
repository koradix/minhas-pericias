import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Inbox, Send, CheckCircle2, Plus, ChevronRight, Clock, MapPin, Handshake, Timer } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDemandas } from '@/lib/data/parceiro-demandas'
import { getPropostas } from '@/lib/data/propostas'
import { formatCurrency } from '@/lib/utils'
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
    : tempoMedioHoras < 24 ? `${tempoMedioHoras}h`
    : `${Math.round(tempoMedioHoras / 24)}d`

  const demandasRecentes = demandas.slice(0, 3)
  const propostasRecentes = propostas.slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Bem-vindo, ${session.user.name ?? 'Parceiro'}! Gerencie suas demandas e propostas.`}
        actions={
          <Link href="/parceiro/demandas/nova">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Nova Demanda
            </Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Demandas Abertas"
          value={demandasAbertas}
          subtitle="Aguardando peritos"
          icon={Inbox}
          accent="lime"
          highlight
        />
        <KPICard
          title="Propostas Enviadas"
          value={propostasEnviadas}
          subtitle="Aguardando resposta"
          icon={Send}
          accent="amber"
        />
        <KPICard
          title="Propostas Aceitas"
          value={propostasAceitas}
          subtitle="Peritos confirmados"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KPICard
          title="Tempo Médio"
          value={tempoMedioLabel}
          subtitle="Para resposta"
          icon={Timer}
          accent="slate"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Demandas recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Minhas Demandas</CardTitle>
              <Link href="/parceiro/demandas">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {demandasRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Nenhuma demanda ainda</p>
                <Link href="/parceiro/demandas/nova">
                  <Button size="sm" variant="outline" className="mt-3">
                    Criar primeira demanda
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {demandasRecentes.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{d.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {d.cidade}/{d.uf}
                        </span>
                        <span>·</span>
                        <span>{d.tipo}</span>
                      </div>
                      {d.valor > 0 && (
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formatCurrency(d.valor)}
                        </p>
                      )}
                    </div>
                    <BadgeStatus status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Propostas recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Propostas Enviadas</CardTitle>
              <Link href="/parceiro/propostas">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {propostasRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Handshake className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Nenhuma proposta enviada</p>
                <Link href="/parceiro/peritos">
                  <Button size="sm" variant="outline" className="mt-3">
                    Buscar peritos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {propostasRecentes.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.peritoNome}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{p.demandaTitulo}</p>
                      {p.valorProposto && (
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formatCurrency(p.valorProposto)}
                        </p>
                      )}
                    </div>
                    <BadgeStatus status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
