'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Bell, BellDot, FileText, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type AlertTipo = 'nomeacao' | 'prazo' | 'honorario' | 'sistema'

const ALERTAS_INICIAIS = [
  {
    id: 1,
    tipo: 'nomeacao' as AlertTipo,
    titulo: 'Nova Nomeação Recebida',
    descricao: 'Você foi nomeado perito no processo 0045678-32.2024.8.19.0001 — 3ª Vara Cível da Comarca da Capital — TJRJ.',
    data: 'Hoje, 09:15',
    prioridade: 'alta',
    link: '/pericias',
    linkLabel: 'Abrir Processo',
  },
  {
    id: 2,
    tipo: 'prazo' as AlertTipo,
    titulo: 'Prazo Vencendo em 3 dias',
    descricao: 'PRC-2024-001 — Avaliação de Imóvel Residencial. Entrega do laudo até 15/03/2026.',
    data: 'Hoje, 08:00',
    prioridade: 'alta',
    link: '/pericias',
    linkLabel: 'Ver Perícia',
  },
  {
    id: 3,
    tipo: 'nomeacao' as AlertTipo,
    titulo: 'Nova Nomeação Recebida',
    descricao: 'Você foi nomeado perito no processo 0012345-67.2024.5.01.0001 — 1ª Vara do Trabalho do Rio de Janeiro — TRT-1.',
    data: 'Ontem, 14:30',
    prioridade: 'alta',
    link: '/pericias',
    linkLabel: 'Abrir Processo',
  },
  {
    id: 4,
    tipo: 'honorario' as AlertTipo,
    titulo: 'Honorário em Atraso',
    descricao: 'PRC-2024-004 — Honorários de R$ 12.000 vencidos há 7 dias. Vara: 5ª Vara Cível de Niterói — TJRJ.',
    data: 'Ontem, 10:00',
    prioridade: 'media',
    link: '/recebimentos',
    linkLabel: 'Ver Recebimento',
  },
  {
    id: 5,
    tipo: 'prazo' as AlertTipo,
    titulo: 'Prazo em 7 dias',
    descricao: 'PRC-2024-002 — Apuração de Haveres Societários. Entrega do laudo até 20/03/2026.',
    data: '10 Mar, 08:00',
    prioridade: 'media',
    link: '/pericias',
    linkLabel: 'Ver Perícia',
  },
  {
    id: 6,
    tipo: 'sistema' as AlertTipo,
    titulo: 'Visita Técnica Confirmada',
    descricao: 'Visita técnica agendada para PRC-2024-003 (Av. Rio Branco, 156 — Centro/RJ) confirmada para hoje às 14:00.',
    data: '09 Mar, 16:45',
    prioridade: 'baixa',
    link: '/visitas',
    linkLabel: 'Ver Visita',
  },
  {
    id: 7,
    tipo: 'nomeacao' as AlertTipo,
    titulo: 'Nova Nomeação Recebida',
    descricao: 'Você foi nomeado perito no processo 5001234-89.2024.4.02.5101 — 3ª Vara Federal do Rio de Janeiro — JFRJ.',
    data: '08 Mar, 11:20',
    prioridade: 'alta',
    link: '/pericias',
    linkLabel: 'Abrir Processo',
  },
  {
    id: 8,
    tipo: 'honorario' as AlertTipo,
    titulo: 'Depósito Recebido',
    descricao: 'PRC-2024-005 — Depósito de honorários no valor de R$ 8.500 recebido. 2ª Vara Cível de Duque de Caxias — TJRJ.',
    data: '07 Mar, 09:00',
    prioridade: 'baixa',
    link: '/recebimentos',
    linkLabel: 'Ver Recebimento',
  },
]

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'nomeacao', label: 'Nomeações' },
  { key: 'prazo', label: 'Prazos' },
  { key: 'honorario', label: 'Honorários' },
  { key: 'sistema', label: 'Sistema' },
]

const tipoConfig: Record<AlertTipo, { icon: typeof Bell; color: string; label: string }> = {
  nomeacao: { icon: BellDot, color: 'bg-blue-50 text-blue-600', label: 'Nomeação' },
  prazo: { icon: Clock, color: 'bg-amber-50 text-amber-600', label: 'Prazo' },
  honorario: { icon: AlertTriangle, color: 'bg-rose-50 text-rose-600', label: 'Honorário' },
  sistema: { icon: Info, color: 'bg-slate-50 text-slate-500', label: 'Sistema' },
}

const prioridadeMap = {
  alta: { label: 'Alta', variant: 'danger' as const },
  media: { label: 'Média', variant: 'warning' as const },
  baixa: { label: 'Baixa', variant: 'secondary' as const },
}

export default function AlertasNomenacoesPage() {
  const [filtroAtivo, setFiltroAtivo] = useState('todos')
  const [lidos, setLidos] = useState<Set<number>>(new Set([4, 5, 6, 8]))

  const alertasFiltrados = useMemo(
    () => ALERTAS_INICIAIS.filter((a) => filtroAtivo === 'todos' || a.tipo === filtroAtivo),
    [filtroAtivo],
  )

  const naoLidos = useMemo(
    () => ALERTAS_INICIAIS.filter((a) => !lidos.has(a.id)).length,
    [lidos],
  )

  const countByTipo = useMemo(() => {
    const c: Record<string, number> = {}
    ALERTAS_INICIAIS.forEach((a) => {
      if (!lidos.has(a.id)) c[a.tipo] = (c[a.tipo] ?? 0) + 1
    })
    return c
  }, [lidos])

  function marcarComoLido(id: number) {
    setLidos((prev) => new Set([...prev, id]))
  }

  function marcarTodosLidos() {
    setLidos(new Set(ALERTAS_INICIAIS.map((a) => a.id)))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Nomeações"
        description="Acompanhe nomeações, prazos e avisos importantes"
        actions={
          <Button variant="outline" size="sm" onClick={marcarTodosLidos} disabled={naoLidos === 0}>
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
        {FILTROS.map((f) => {
          const count = f.key === 'todos' ? naoLidos : (countByTipo[f.key] ?? 0)
          const isActive = filtroAtivo === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFiltroAtivo(f.key)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {alertasFiltrados.map((alerta) => {
          const config = tipoConfig[alerta.tipo]
          const Icon = config.icon
          const prioridade = prioridadeMap[alerta.prioridade as keyof typeof prioridadeMap]
          const isLido = lidos.has(alerta.id)

          return (
            <div
              key={alerta.id}
              onClick={() => marcarComoLido(alerta.id)}
              className={`relative flex gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                isLido
                  ? 'border-slate-200 bg-white'
                  : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              {/* Unread dot */}
              {!isLido && (
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-600" />
              )}

              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className={`text-sm font-semibold ${isLido ? 'text-slate-700' : 'text-slate-900'}`}>
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

              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link href={alerta.link}>
                  <Button size="sm" variant="outline">
                    <FileText className="h-3.5 w-3.5" />
                    {alerta.linkLabel}
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}

        {alertasFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">Nenhum alerta neste filtro</p>
            <p className="text-xs text-slate-400 mt-1">Tente selecionar outro tipo de alerta</p>
          </div>
        )}
      </div>
    </div>
  )
}
