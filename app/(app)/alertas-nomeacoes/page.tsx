import { Bell, BellDot, FileText, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Alertas de Nomeações' }

type AlertTipo = 'nomeacao' | 'prazo' | 'honorario' | 'sistema'

const alertas = [
  {
    id: 1,
    tipo: 'nomeacao' as AlertTipo,
    titulo: 'Nova Nomeação Recebida',
    descricao: 'Você foi nomeado perito no processo 0078901-23.2024.8.26.0001 — 7ª Vara Cível TJSP.',
    data: 'Hoje, 09:15',
    lido: false,
    prioridade: 'alta',
  },
  {
    id: 2,
    tipo: 'prazo' as AlertTipo,
    titulo: 'Prazo Vencendo em 3 dias',
    descricao: 'PRC-2024-005 — Perícia de Engenharia Civil. Entrega do laudo até 15/12/2024.',
    data: 'Hoje, 08:00',
    lido: false,
    prioridade: 'alta',
  },
  {
    id: 3,
    tipo: 'nomeacao' as AlertTipo,
    titulo: 'Nova Nomeação Recebida',
    descricao: 'Você foi nomeado perito no processo 0067890-12.2024.4.03.6100 — 1ª Vara Federal.',
    data: 'Ontem, 14:30',
    lido: false,
    prioridade: 'alta',
  },
  {
    id: 4,
    tipo: 'honorario' as AlertTipo,
    titulo: 'Honorário em Atraso',
    descricao: 'PRC-2024-000 — Honorários de R$ 15.000 vencidos há 7 dias. Cliente: Banco Invest S.A.',
    data: 'Ontem, 10:00',
    lido: true,
    prioridade: 'media',
  },
  {
    id: 5,
    tipo: 'prazo' as AlertTipo,
    titulo: 'Prazo em 7 dias',
    descricao: 'PRC-2024-002 — Perícia Trabalhista. Entrega do laudo até 20/12/2024.',
    data: '10 Dez, 08:00',
    lido: true,
    prioridade: 'media',
  },
  {
    id: 6,
    tipo: 'sistema' as AlertTipo,
    titulo: 'Visita Confirmada',
    descricao: 'Visita técnica agendada para PRC-2024-001 confirmada para hoje às 14:00.',
    data: '09 Dez, 16:45',
    lido: true,
    prioridade: 'baixa',
  },
]

const tipoConfig: Record<AlertTipo, { icon: typeof Bell; color: string; label: string }> = {
  nomeacao: {
    icon: BellDot,
    color: 'bg-blue-50 text-blue-600',
    label: 'Nomeação',
  },
  prazo: {
    icon: Clock,
    color: 'bg-amber-50 text-amber-600',
    label: 'Prazo',
  },
  honorario: {
    icon: AlertTriangle,
    color: 'bg-rose-50 text-rose-600',
    label: 'Honorário',
  },
  sistema: {
    icon: Info,
    color: 'bg-slate-50 text-slate-500',
    label: 'Sistema',
  },
}

const prioridadeMap = {
  alta: { label: 'Alta', variant: 'danger' as const },
  media: { label: 'Média', variant: 'warning' as const },
  baixa: { label: 'Baixa', variant: 'secondary' as const },
}

export default function AlertasNomenacoesPage() {
  const naoLidos = alertas.filter((a) => !a.lido).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Nomeações"
        description="Acompanhe nomeações, prazos e avisos importantes"
        actions={
          <Button variant="outline" size="sm">
            <CheckCircle2 className="h-4 w-4" />
            Marcar todos como lidos
          </Button>
        }
      />

      {/* Summary */}
      {naoLidos > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Bell className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700 font-medium">
            Você tem {naoLidos} {naoLidos === 1 ? 'alerta não lido' : 'alertas não lidos'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Nomeações', 'Prazos', 'Honorários', 'Sistema'].map((f) => (
          <button
            key={f}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
              f === 'Todos'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {alertas.map((alerta) => {
          const config = tipoConfig[alerta.tipo]
          const Icon = config.icon
          const prioridade = prioridadeMap[alerta.prioridade as keyof typeof prioridadeMap]

          return (
            <div
              key={alerta.id}
              className={`relative flex gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                alerta.lido
                  ? 'border-slate-200 bg-white'
                  : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              {/* Unread dot */}
              {!alerta.lido && (
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-600" />
              )}

              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p
                    className={`text-sm font-semibold ${
                      alerta.lido ? 'text-slate-700' : 'text-slate-900'
                    }`}
                  >
                    {alerta.titulo}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={prioridade.variant}>{prioridade.label}</Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{alerta.descricao}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {alerta.data}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {config.label}
                  </span>
                </div>
              </div>

              {alerta.tipo === 'nomeacao' && (
                <div className="flex-shrink-0">
                  <Button size="sm" variant="outline">
                    <FileText className="h-3.5 w-3.5" />
                    Abrir Processo
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
