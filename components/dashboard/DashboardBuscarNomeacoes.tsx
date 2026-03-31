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
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-6 border-b border-[#f2f3f9]">
        <div>
          <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
            Buscar Nomeações
            {naoLidas > 0 && (
              <span className="ml-2.5 bg-[#416900] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {naoLidas} não lida(s)
              </span>
            )}
          </p>
          <p className="text-[12px] text-[#9ca3af] mt-1 font-inter">Última busca: {dataFormatada}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5">
          <button
            onClick={handleClick}
            disabled={isPending}
            className="bg-[#1f2937] hover:bg-[#374151] disabled:bg-[#d1d5db]
                       text-white font-semibold px-5 py-2.5 rounded-lg text-[14px] font-inter transition-all"
          >
            {isPending ? 'Buscando...' : 'Buscar Agora'}
          </button>
          <p className="text-[11px] text-[#9ca3af] font-inter">R$ 3,00 / chamada</p>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-6 py-4">
          <p className="text-[13px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3 font-inter">
            {error}
          </p>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {resultados !== null && (
        <div className="px-6 py-6 border-t border-[#f2f3f9]">
          {resultados.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af] text-center py-5 border border-dashed border-[#d1d5db] rounded-lg font-inter">
              Nenhuma nomeação nova nos últimos 7 dias
            </p>
          ) : (
            <div className="space-y-4">
              {resultados.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-4 rounded-lg border border-[#e2e8f0] p-4 hover:border-[#416900]/30 hover:bg-[#f4fce3]/20 transition-all font-inter"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f4fce3]">
                    <FileText className="h-5 w-5 text-[#416900]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1f2937] truncate font-manrope">{r.titulo}</p>
                    <p className="text-[12px] text-[#6b7280] mt-1 font-inter">{r.tribunal}</p>
                    <p className="text-[12px] text-[#9ca3af] mt-1.5 line-clamp-2 leading-relaxed font-inter">{r.snippet}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-[#9ca3af] font-inter">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </span>
                    {r.link && (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#416900] hover:text-[#325200] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver detalhes
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
