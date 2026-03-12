import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const recentPericias = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    status: 'em_andamento',
    cliente: 'João Silva',
    prazo: '15/12/2024',
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    status: 'aguardando',
    cliente: 'Maria Santos',
    prazo: '20/12/2024',
  },
  {
    id: 3,
    numero: 'PRC-2024-003',
    assunto: 'Laudo Contábil Societário',
    status: 'concluida',
    cliente: 'Carlos Oliveira',
    prazo: '10/12/2024',
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento',
    status: 'em_andamento',
    cliente: 'Ana Costa',
    prazo: '22/12/2024',
  },
]

const statusMap = {
  em_andamento: { label: 'Em andamento', variant: 'info' as const },
  aguardando: { label: 'Aguardando', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}

const upcomingVisitas = [
  { id: 1, local: 'Rua das Flores, 123 — SP', data: 'Hoje, 14:00', tipo: 'Vistoria' },
  { id: 2, local: 'Av. Paulista, 1000 — SP', data: 'Amanhã, 09:30', tipo: 'Entrevista' },
  { id: 3, local: 'Rua do Comércio, 45 — SP', data: '18 Dez, 10:00', tipo: 'Vistoria' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bem-vindo de volta. Veja o resumo das suas atividades.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Perícias Ativas"
          value="24"
          description="3 novas esta semana"
          icon={FileText}
          accent="blue"
          trend={{ value: 12, label: 'vs. mês anterior', positive: true }}
        />
        <StatsCard
          title="Visitas Agendadas"
          value="8"
          description="Próximos 7 dias"
          icon={Calendar}
          accent="violet"
          trend={{ value: 5, label: 'vs. semana anterior', positive: true }}
        />
        <StatsCard
          title="Honorários Pendentes"
          value="R$ 48.500"
          description="12 recebimentos em aberto"
          icon={DollarSign}
          accent="amber"
          trend={{ value: 3, label: 'vs. mês anterior', positive: false }}
        />
        <StatsCard
          title="Contatos Ativos"
          value="137"
          description="Partes, advogados e peritos"
          icon={Users}
          accent="emerald"
          trend={{ value: 8, label: 'novos este mês', positive: true }}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent perícias — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Perícias Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 -mr-2">
                Ver todas →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {recentPericias.map((p) => {
                const status = statusMap[p.status as keyof typeof statusMap]
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.assunto}</p>
                        <p className="text-xs text-slate-400">
                          {p.numero} · {p.cliente}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {p.prazo}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda da Semana</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {upcomingVisitas.map((v) => (
                  <div key={v.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <Calendar className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{v.tipo}</p>
                      <p className="text-xs text-slate-400 truncate">{v.local}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{v.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Nova nomeação recebida</p>
                    <p className="text-xs text-slate-400">Processo 0012345-67.2024</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Honorário recebido</p>
                    <p className="text-xs text-slate-400">PRC-2024-001 · R$ 4.200</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Prazo em 3 dias</p>
                    <p className="text-xs text-slate-400">PRC-2024-005 · Laudo Pericial</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
