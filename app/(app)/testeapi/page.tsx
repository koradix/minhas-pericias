'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Zap, Calendar } from 'lucide-react'
import {
  testFluxoNomeacoes,
  getDadosBuscaPerfil,
  type TestFluxoResult,
} from '@/lib/actions/test-escavador'

export default function TesteApiPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')

  const [resultFluxo, setResultFluxo] = useState<TestFluxoResult | null>(null)
  const [isFluxoPending, startFluxoTransition] = useTransition()

  useEffect(() => {
    getDadosBuscaPerfil().then((d) => {
      setNome(d.nome)
      setCpf(d.cpf)
      setEmail(d.email)
    })
  }, [])

  function handleTestFluxo() {
    setResultFluxo(null)
    startFluxoTransition(async () => {
      const res = await testFluxoNomeacoes({ nome, cpf, email })
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

      {/* ━━━━━━━━━━━━━━━━ Formulário ━━━━━━━━━━━━━━━━ */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-5 space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo do perito"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            CPF
          </label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Botão disparar */}
      <button
        onClick={handleTestFluxo}
        disabled={isFluxoPending || !nome.trim()}
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
              {/* ━━━━━━━━━━━━━━━━ Resultados ━━━━━━━━━━━━━━━━ */}
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Busca em {new Date().toLocaleString('pt-BR')}
              </div>

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

              {/* ━━━━━━━━━━━━━━━━ Processos ━━━━━━━━━━━━━━━━ */}
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
