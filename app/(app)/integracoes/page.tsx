import { Plug, ExternalLink, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integrações' }

type IntegracaoStatus = 'disponivel' | 'em_breve' | 'conectado'

const integracoes = [
  {
    id: 1,
    nome: 'TJSP — Tribunal de Justiça de SP',
    descricao: 'Consulta e monitoramento de processos, alertas de nomeações automáticos.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Estadual',
    logo: 'TJ',
    logoColor: 'bg-blue-600',
  },
  {
    id: 2,
    nome: 'TRF-3 — Tribunal Regional Federal',
    descricao: 'Acesso a processos federais, nomeações e comunicações automáticas.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Federal',
    logo: 'TRF',
    logoColor: 'bg-indigo-600',
  },
  {
    id: 3,
    nome: 'TRT-2 — Tribunal Regional do Trabalho',
    descricao: 'Monitoramento de processos trabalhistas e alertas de nomeação.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Trabalhista',
    logo: 'TRT',
    logoColor: 'bg-emerald-600',
  },
  {
    id: 4,
    nome: 'PJe — Processo Judicial Eletrônico',
    descricao: 'Integração com o sistema PJe para consulta de andamentos e peças processuais.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Sistema Nacional',
    logo: 'PJe',
    logoColor: 'bg-slate-700',
  },
  {
    id: 5,
    nome: 'E-mail — Alertas e Notificações',
    descricao: 'Envio automático de notificações, lembretes de prazo e resumos semanais.',
    status: 'disponivel' as IntegracaoStatus,
    categoria: 'Comunicação',
    logo: '@',
    logoColor: 'bg-violet-600',
  },
  {
    id: 6,
    nome: 'Google Calendar',
    descricao: 'Sincronize suas visitas e prazos com o Google Calendar automaticamente.',
    status: 'disponivel' as IntegracaoStatus,
    categoria: 'Produtividade',
    logo: 'GC',
    logoColor: 'bg-rose-500',
  },
]

const statusConfig: Record<IntegracaoStatus, { label: string; variant: 'success' | 'secondary' | 'info'; icon: typeof CheckCircle }> = {
  conectado: { label: 'Conectado', variant: 'success', icon: CheckCircle },
  disponivel: { label: 'Disponível', variant: 'info', icon: Plug },
  em_breve: { label: 'Em breve', variant: 'secondary', icon: Clock },
}

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Conecte o Minhas Perícias com tribunais e ferramentas externas"
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Integrações com Tribunais em Desenvolvimento</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Estamos trabalhando para conectar o sistema diretamente aos tribunais. As integrações
            serão liberadas progressivamente. Você será notificado quando estiverem disponíveis.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integracoes.map((integracao) => {
          const config = statusConfig[integracao.status]
          const StatusIcon = config.icon
          const isAvailable = integracao.status === 'disponivel'
          const isConnected = integracao.status === 'conectado'

          return (
            <div
              key={integracao.id}
              className={`rounded-xl border bg-white p-5 flex flex-col gap-4 transition-all ${
                isAvailable
                  ? 'border-slate-200 hover:shadow-md hover:border-blue-200 cursor-pointer'
                  : 'border-slate-200'
              } ${!isAvailable && !isConnected ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold ${integracao.logoColor}`}
                  >
                    {integracao.logo}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {integracao.nome}
                    </p>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {integracao.categoria}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed flex-1">{integracao.descricao}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Badge variant={config.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                {isAvailable && (
                  <Button size="sm" variant="outline" className="text-xs">
                    Configurar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                {isConnected && (
                  <Button size="sm" variant="ghost" className="text-xs text-slate-500">
                    Gerenciar
                  </Button>
                )}
                {integracao.status === 'em_breve' && (
                  <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Notificar-me
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center py-4">
        <p className="text-xs text-slate-400 text-center max-w-md">
          Precisa de uma integração específica?{' '}
          <button className="text-blue-600 hover:underline font-medium">
            Solicite aqui
          </button>{' '}
          e avaliaremos a implementação.
        </p>
      </div>
    </div>
  )
}
