'use client'

/**
 * Timeline de movimentacoes do processo (dados Judit).
 *
 * Isolado — nao interfere na timeline de cronologia existente.
 * Renderiza apenas se houver movimentacoes source='judit'.
 */

import { cn } from '@/lib/utils'

interface Movement {
  id: string
  eventDate: string
  type: string | null
  description: string
}

interface Props {
  movements: Movement[]
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const TYPE_COLORS: Record<string, string> = {
  despacho: 'bg-blue-100 text-blue-700 border-blue-200',
  sentenca: 'bg-amber-100 text-amber-700 border-amber-200',
  decisao: 'bg-purple-100 text-purple-700 border-purple-200',
  intimacao: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  peticao: 'bg-slate-100 text-slate-600 border-slate-200',
}

function getTypeStyle(type: string | null): string {
  if (!type) return 'bg-slate-50 text-slate-500 border-slate-100'
  const key = type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key.includes(k)) return v
  }
  return 'bg-slate-50 text-slate-500 border-slate-100'
}

export function ProcessTimeline({ movements }: Props) {
  if (movements.length === 0) return null

  const sorted = [...movements].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  )

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">
          Movimentacoes do Processo
        </h2>
        <div className="h-px flex-1 bg-slate-900/10" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5">
          JUDIT
        </span>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="max-h-[500px] overflow-y-auto">
          <ol className="relative border-l-2 border-slate-100 mx-8 my-6 space-y-8">
            {sorted.map((mov) => (
              <li key={mov.id} className="ml-6 flex flex-col gap-1.5">
                <span className="absolute -left-[9px] h-4 w-4 border-2 bg-[#a3e635] border-[#a3e635]" />
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    {formatDate(mov.eventDate)}
                  </p>
                  {mov.type && (
                    <span className={cn(
                      'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border',
                      getTypeStyle(mov.type),
                    )}>
                      {mov.type}
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-slate-700 leading-relaxed">
                  {mov.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
