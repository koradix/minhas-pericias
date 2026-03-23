'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { VaraItem } from '@/lib/data/varas'

interface Props {
  varas: VaraItem[]
}

export function VarasChart({ varas }: Props) {
  const top10 = varas.slice(0, 10)

  if (top10.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-xs text-zinc-500">Nenhuma nomeação registrada ainda — execute o radar para acumular dados</p>
      </div>
    )
  }

  const data = top10.map((v) => ({
    name: v.varaNome.length > 28 ? v.varaNome.slice(0, 25) + '…' : v.varaNome,
    nomeacoes: v.totalNomeacoes,
    sigla: v.tribunalSigla,
  }))

  const maxVal = Math.max(...data.map((d) => d.nomeacoes), 1)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <XAxis
          type="number"
          domain={[0, maxVal]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as typeof data[0]
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-saas text-xs">
                <p className="font-semibold text-foreground">{d.sigla}</p>
                <p className="text-zinc-400">{d.name}</p>
                <p className="font-bold text-brand-400 mt-0.5">{d.nomeacoes} nomeação(ões)</p>
              </div>
            )
          }}
        />
        <Bar dataKey="nomeacoes" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.nomeacoes >= maxVal * 0.7 ? '#84cc16' : entry.nomeacoes >= maxVal * 0.4 ? '#fbbf24' : '#cbd5e1'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
