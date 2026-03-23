'use client'

import { useState, useTransition } from 'react'
import { Calendar, ExternalLink, FileText } from 'lucide-react'
import { buscarNomeacoesDireto, type NomeacaoCard } from '@/lib/actions/buscar-nomeacoes-direto'

export function DashboardBuscarNomeacoes({
  ultimaBusca,
  naoLidas,
}: {
  ultimaBusca: Date | null
  naoLidas: number
}) {
  const [isPending, startTransition] = useTransition()
  const [resultados, setResultados] = useState<NomeacaoCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    setResultados(null)
    startTransition(async () => {
      const res = await buscarNomeacoesDireto()
      if (res.ok) {
        setResultados(res.resultados)
      } else {
        setError(res.error ?? 'Erro ao buscar')
      }
    })
  }

  const dataFormatada = ultimaBusca
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(ultimaBusca))
    : 'Nunca'

  return (
    <div className="bg-card border border-brand-500/30 rounded-xl overflow-hidden">

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium text-sm">
            Buscar Nomeações
            {naoLidas > 0 && (
              <span className="ml-2 bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full">
                {naoLidas} não lida(s)
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400">Última busca: {dataFormatada}</p>
        </div>
        <div className="text-right">
          <button
            onClick={handleClick}
            disabled={isPending}
            className="bg-brand-500 hover:bg-lime-600 disabled:bg-gray-300
                       text-white font-semibold px-5 py-2 rounded-xl text-sm"
          >
            {isPending ? 'Buscando...' : 'Buscar Nomeações'}
          </button>
          <p className="text-xs text-gray-400 mt-1">R$ 3,00 por chamada</p>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 pb-4">
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </p>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {resultados !== null && (
        <div className="px-4 pb-4">
          {resultados.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-3 border border-dashed border-border rounded-xl">
              Nenhuma nomeação nova nos últimos 7 dias
            </p>
          ) : (
            <div className="space-y-2">
              {resultados.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-border p-3 hover:border-brand-500/30 hover:bg-brand-500/10/30 transition-all"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <FileText className="h-3.5 w-3.5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.titulo}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{r.tribunal}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{r.snippet}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </span>
                    {r.link && (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand-500 hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
