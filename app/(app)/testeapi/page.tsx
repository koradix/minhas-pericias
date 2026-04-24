'use client'

import { useState, useTransition } from 'react'
import { Loader2, Zap, User, Mail, CreditCard, Calendar } from 'lucide-react'
import { testFluxoNomeacoes, type TestFluxoResult } from '@/lib/actions/test-escavador'

export default function TesteApiPage() {
  const [resultFluxo, setResultFluxo] = useState<TestFluxoResult | null>(null)
  const [isFluxoPending, startFluxoTransition] = useTransition()

  function handleTestFluxo() {
    setResultFluxo(null)
    startFluxoTransition(async () => {
      const res = await testFluxoNomeacoes()
      setResultFluxo(res)
    })
  }

  function formatData(iso: string | null | undefined): string {
    if (!iso) return '—'
    try {
      const clean = iso.split('T')[0]
      const [y, m, d] = clean.split('-')
      return `${d}/${m}/${y}`
    } catch {
      return iso
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          Teste de Busca
        </h1>
        <p className="text-[12px] text-slate-400 mt-1">
          Simula o fluxo de busca de nomeações sem persistir no banco
        </p>
      </div>

      {/* Botão disparar */}
      <button
        onClick={handleTestFluxo}
        disabled={isFluxoPending}
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-5 text-[14px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
      >
        {isFluxoPending
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Buscando...</>
          : <><Zap className="h-5 w-5" /> Buscar agora</>
        }
      </button>

      {resultFluxo && (
        <div className="space-y-4">
          {!resultFluxo.ok ? (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-[13px] text-rose-800">❌ {resultFluxo.error}</p>
            </div>
          ) : (
            <>
              {/* ━━━━━━━━━━━━━━━━ Dados do perito ━━━━━━━━━━━━━━━━ */}
              {resultFluxo.input && (
                <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/30 p-6 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">
                    Dados usados na busca
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-widest w-16">Nome</span>
                      <span className="text-[14px] font-semibold text-slate-800">{resultFluxo.input.nome}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-widest w-16">Email</span>
                      <span className="text-[14px] font-mono text-slate-800">
                        {resultFluxo.input.email ?? <span className="text-slate-400 italic">(não cadastrado)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-widest w-16">CPF</span>
                      <span className="text-[14px] font-mono text-slate-800">
                        {resultFluxo.input.cpf ?? <span className="text-slate-400 italic">(não cadastrado)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-indigo-200">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span className="text-[11px] font-bold uppercase text-indigo-500 tracking-widest w-16">Busca</span>
                      <span className="text-[13px] font-semibold text-indigo-900">
                        {new Date().toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ━━━━━━━━━━━━━━━━ Resultados ━━━━━━━━━━━━━━━━ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-emerald-50 border-2 border-emerald-300 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Confirmadas (V2)</p>
                  <p className="text-[28px] font-black text-emerald-900">{resultFluxo.confirmadas.length}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border-2 border-amber-300 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Diário Oficial</p>
                  <p className="text-[28px] font-black text-amber-900">{resultFluxo.diarioOficial.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Créditos</p>
                  <p className="text-[28px] font-black text-slate-900">{resultFluxo.creditosConsumidos ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tempo</p>
                  <p className="text-[28px] font-black text-slate-900">{resultFluxo.durationMs}ms</p>
                </div>
              </div>

              {/* ━━━━━━━━━━━━━━━━ Processos (com data) ━━━━━━━━━━━━━━━━ */}
              {resultFluxo.confirmadas.length > 0 && (
                <div className="rounded-lg border-2 border-emerald-400 bg-white overflow-hidden">
                  <div className="bg-emerald-100 px-4 py-3">
                    <p className="text-[13px] font-black text-emerald-900 uppercase tracking-widest">
                      ✅ Nomeações confirmadas (V2)
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {resultFluxo.confirmadas.map((c, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-0.5 uppercase tracking-widest">
                            {(c.diarioSigla as string) ?? '—'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatData(c.diarioData as string)}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-700">{(c.snippet as string)?.slice(0, 200) ?? '—'}</p>
                        {c.numeroProcesso as string ? (
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{c.numeroProcesso as string}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resultFluxo.diarioOficial.length > 0 && (
                <div className="rounded-lg border-2 border-amber-400 bg-white overflow-hidden">
                  <div className="bg-amber-100 px-4 py-3">
                    <p className="text-[13px] font-black text-amber-900 uppercase tracking-widest">
                      📰 Diário Oficial
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {resultFluxo.diarioOficial.map((c, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-0.5 uppercase tracking-widest">
                            {(c.diarioSigla as string) ?? '—'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatData(c.diarioData as string)}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-700">{(c.snippet as string)?.slice(0, 200) ?? '—'}</p>
                        {c.numeroProcesso as string ? (
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{c.numeroProcesso as string}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resultFluxo.confirmadas.length === 0 && resultFluxo.diarioOficial.length === 0 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center">
                  <p className="text-[13px] text-slate-500">Nenhuma nomeação encontrada.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
