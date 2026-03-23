import {
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Download,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Relatórios' }

const relatorios = [
  {
    id: 1,
    titulo: 'Produtividade Pericial',
    descricao: 'Perícias por período, tempo médio de conclusão e taxa de entrega',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600',
    tags: ['Mensal', 'Comparativo'],
    disponivel: true,
  },
  {
    id: 2,
    titulo: 'Resultado Financeiro',
    descricao: 'Honorários recebidos, pendentes e evolução da receita ao longo do tempo',
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    tags: ['Mensal', 'Anual'],
    disponivel: true,
  },
  {
    id: 3,
    titulo: 'Perícias por Área',
    descricao: 'Distribuição das perícias por tipo, área do direito e tribunal',
    icon: FileText,
    color: 'bg-violet-50 text-violet-600',
    tags: ['Gráfico', 'Pizza'],
    disponivel: true,
  },
  {
    id: 4,
    titulo: 'Agenda e Visitas',
    descricao: 'Relatório de visitas realizadas, agendadas e distância percorrida',
    icon: Calendar,
    color: 'bg-amber-50 text-amber-600',
    tags: ['Semanal', 'Mensal'],
    disponivel: true,
  },
  {
    id: 5,
    titulo: 'Peritos Parceiros',
    descricao: 'Performance dos peritos parceiros, pagamentos e trabalhos realizados',
    icon: Users,
    color: 'bg-rose-50 text-rose-600',
    tags: ['Avaliação', 'Financeiro'],
    disponivel: true,
  },
  {
    id: 6,
    titulo: 'Projeção de Receita',
    descricao: 'Previsão financeira baseada em perícias em andamento e histórico',
    icon: TrendingUp,
    color: 'bg-cyan-50 text-cyan-600',
    tags: ['IA', 'Em breve'],
    disponivel: false,
  },
]

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises e relatórios gerenciais das suas atividades periciais"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((r) => {
          const Icon = r.icon
          return (
            <div
              key={r.id}
              className={`rounded-xl border bg-card p-5 transition-all ${
                r.disponivel
                  ? 'border-border hover:shadow-md hover:border-blue-200 cursor-pointer group'
                  : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {!r.disponivel && (
                  <Badge variant="secondary">Em breve</Badge>
                )}
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1">{r.titulo}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{r.descricao}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {r.disponivel && (
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
