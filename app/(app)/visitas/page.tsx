import { Calendar, Plus, MapPin, Clock, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Visitas' }

const visitas = [
  {
    id: 1,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    local: 'Rua das Flores, 123 — Jardins, SP',
    data: 'Hoje',
    hora: '14:00',
    status: 'confirmada',
  },
  {
    id: 2,
    tipo: 'Entrevista',
    pericia: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento',
    local: 'Av. Paulista, 1000 — Bela Vista, SP',
    data: 'Amanhã',
    hora: '09:30',
    status: 'confirmada',
  },
  {
    id: 3,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-006',
    assunto: 'Laudo Ambiental',
    local: 'Rua do Comércio, 45 — Centro, SP',
    data: '18 Dez',
    hora: '10:00',
    status: 'pendente',
  },
  {
    id: 4,
    tipo: 'Reunião Técnica',
    pericia: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    local: 'TRT-2 — Rua da Consolação, 300',
    data: '20 Dez',
    hora: '14:30',
    status: 'pendente',
  },
  {
    id: 5,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil',
    local: 'Av. Brigadeiro Faria Lima, 2000 — Itaim Bibi',
    data: '22 Dez',
    hora: '09:00',
    status: 'confirmada',
  },
]

const statusMap = {
  confirmada: { label: 'Confirmada', variant: 'success' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
  realizada: { label: 'Realizada', variant: 'secondary' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}

const tipoColors: Record<string, string> = {
  Vistoria: 'bg-blue-50 text-blue-600',
  Entrevista: 'bg-violet-50 text-violet-600',
  'Reunião Técnica': 'bg-amber-50 text-amber-600',
}

export default function VisitasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas"
        description="Agende e gerencie visitas, vistorias e entrevistas"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Esta semana', value: '3', color: 'text-blue-600 bg-blue-50' },
          { label: 'Próximos 30 dias', value: '8', color: 'text-violet-600 bg-violet-50' },
          { label: 'Realizadas (mês)', value: '12', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pendentes', value: '2', color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold mb-2 ${item.color}`}
            >
              {item.value}
            </div>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming visits list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Próximas Visitas</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs">
                Lista
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Calendário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {visitas.map((v) => {
              const status = statusMap[v.status as keyof typeof statusMap]
              const tipoColor = tipoColors[v.tipo] ?? 'bg-slate-50 text-slate-600'
              return (
                <div
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Date block */}
                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase leading-none">
                      {v.data.split(' ')[1] ?? 'DEZ'}
                    </span>
                    <span className="text-lg font-bold text-slate-900 leading-none">
                      {v.data.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tipoColor}`}
                      >
                        {v.tipo}
                      </span>
                      <span className="text-xs text-slate-400">{v.pericia}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">
                      {v.assunto}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{v.local}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {v.hora}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <button className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
