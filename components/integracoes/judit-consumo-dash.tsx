'use client'

/**
 * Dashboard de consumo da API Judit.
 * Mostra: total de requests, custo estimado, breakdown por tipo.
 */

import { useState, useTransition } from 'react'
import { Loader2, BarChart3, FileSearch, Download, Eye, DollarSign, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getConsumoJudit, type ConsumoResumo } from '@/lib/actions/judit-consumo'

const TIPO_LABEL: Record<string, string> = {
  lawsuit_cnj: 'Busca por CNJ',
  cpf: 'Busca por CPF',
  cnpj: 'Busca por CNPJ',
  name: 'Busca por Nome',
  oab: 'Busca por OAB',
}

const TIPO_ICON: Record<string, typeof FileSearch> = {
  lawsuit_cnj: FileSearch,
  cpf: Eye,
  cnpj: Eye,
  name: Eye,
  oab: Eye,
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function JuditConsumoDash() {
  const [data, setData] = useState<ConsumoResumo | null>(null)
  const [loading, startTransition] = useTransition()
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d')

  function handleCarregar() {
    startTransition(async () => {
      const agora = new Date()
      const dias = periodo === '7d' ? 7 : periodo === '90d' ? 90 : 30
      const de = new Date(agora.getTime() - dias * 86400000).toISOString().split('T')[0]
      const ate = agora.toISOString().split('T')[0]
      const result = await getConsumoJudit(de, ate)
      setData(result)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Consumo API Judit</h3>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                'px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all',
                periodo === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
          <button
            onClick={handleCarregar}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#a3e635] hover:bg-[#bef264] px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-900 transition-all disabled:opacity-30"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
            Carregar
          </button>
        </div>
      </div>

      {!data && !loading && (
        <div className="border border-slate-200 bg-slate-50 px-8 py-12 text-center">
          <BarChart3 className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Clique em "Carregar" para ver o consumo</p>
        </div>
      )}

      {data && !data.ok && (
        <div className="border border-rose-200 bg-rose-50 px-6 py-4">
          <p className="text-[11px] font-bold text-rose-600">{data.message}</p>
        </div>
      )}

      {data?.ok && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requests</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{data.totalRequests}</p>
              <p className="text-[9px] text-slate-400 mt-1">{data.periodo.de} — {data.periodo.ate}</p>
            </div>
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custo estimado</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(data.custoTotal)}</p>
              <p className="text-[9px] text-slate-400 mt-1">Valores ilustrativos</p>
            </div>
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Com anexos</p>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {data.items.filter(i => i.comAnexos).length}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">
                {formatCurrency(data.items.filter(i => i.comAnexos).length * 3.50)} em docs
              </p>
            </div>
          </div>

          {/* Breakdown por tipo */}
          <div className="border border-slate-200 bg-white">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Por tipo de consulta</p>
            </div>
            <div className="divide-y divide-slate-100">
              {Object.entries(data.porTipo).map(([tipo, info]) => {
                const Icon = TIPO_ICON[tipo] ?? Eye
                return (
                  <div key={tipo} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">{TIPO_LABEL[tipo] ?? tipo}</p>
                        <p className="text-[9px] text-slate-400">{info.count} request{info.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-slate-900">{formatCurrency(info.custo)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lista de requests */}
          <div className="border border-slate-200 bg-white">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Histórico de requisições</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {data.items.map(item => (
                <div key={item.id} className="flex items-center justify-between px-6 py-3 text-[10px]">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-slate-400 font-mono">{formatDate(item.data)}</span>
                    <span className="font-bold text-slate-700">{TIPO_LABEL[item.tipo] ?? item.tipo}</span>
                    <span className="text-slate-400 font-mono truncate">{item.chave}</span>
                    {item.comAnexos && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200">
                        Anexos
                      </span>
                    )}
                    <span className={cn(
                      'text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border',
                      item.origem === 'tracking'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200',
                    )}>
                      {item.origem}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 flex-shrink-0">{formatCurrency(item.custoEstimado)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
