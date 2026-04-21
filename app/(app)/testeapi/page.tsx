'use client'

import { useState, useTransition } from 'react'
import { Loader2, Search, Wallet } from 'lucide-react'
import { testBuscarProcessosEnvolvido, testVerificarSaldo, type TestEscavadorResult } from '@/lib/actions/test-escavador'

export default function TesteApiPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [result, setResult] = useState<TestEscavadorResult | null>(null)
  const [saldoInfo, setSaldoInfo] = useState<{ saldo?: number; descricao?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSaldoPending, startSaldoTransition] = useTransition()

  function handleBuscar() {
    setResult(null)
    startTransition(async () => {
      const res = await testBuscarProcessosEnvolvido(nome, cpf)
      setResult(res)
    })
  }

  function handleSaldo() {
    setSaldoInfo(null)
    startSaldoTransition(async () => {
      const res = await testVerificarSaldo()
      setSaldoInfo(res)
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 px-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          🧪 Teste API Escavador
        </h1>
        <p className="text-[12px] text-slate-400 mt-1">
          Página temporária — testa /v2/envolvido/processos. Exclua depois dos testes.
        </p>
      </div>

      {/* Verificar saldo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-slate-500" />
          <h2 className="text-[14px] font-semibold text-slate-800">Verificar saldo (grátis)</h2>
        </div>
        <button
          onClick={handleSaldo}
          disabled={isSaldoPending}
          className="flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isSaldoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Consultar saldo
        </button>
        {saldoInfo && (
          <div className={`rounded-lg border px-4 py-3 ${saldoInfo.error ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {saldoInfo.error ? (
              <p className="text-[13px] text-rose-800">❌ {saldoInfo.error}</p>
            ) : (
              <div>
                <p className="text-[13px] font-semibold text-emerald-900">Saldo: {saldoInfo.saldo}</p>
                {saldoInfo.descricao && (
                  <p className="text-[12px] text-emerald-700">{saldoInfo.descricao}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Busca por nome + CPF */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <h2 className="text-[14px] font-semibold text-slate-800">Buscar processos (CUSTA CRÉDITO)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              Nome completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: José da Silva"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-slate-900 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              CPF (opcional, 11 dígitos)
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="Ex: 123.456.789-00"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-slate-900 transition-all"
            />
          </div>
        </div>
        <button
          onClick={handleBuscar}
          disabled={isPending || !nome.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a3e635] hover:bg-[#bef264] text-slate-900 px-4 py-3 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar processos
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-[14px] font-semibold text-slate-800">Resultado</h2>

          {!result.ok ? (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-[13px] text-rose-800">❌ {result.error}</p>
              {result.durationMs != null && (
                <p className="text-[11px] text-rose-600 mt-1">{result.durationMs}ms</p>
              )}
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total processos</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.totalProcessos ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Páginas</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.totalPages ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Citações (filtradas)</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.citacoesCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tempo</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.durationMs}ms</p>
                </div>
              </div>

              {/* Saldo */}
              <div className="flex items-center gap-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo antes</p>
                  <p className="text-[15px] font-bold text-amber-900">{result.saldoAntes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo depois</p>
                  <p className="text-[15px] font-bold text-amber-900">{result.saldoDepois}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Consumido</p>
                  <p className="text-[15px] font-bold text-amber-900">
                    {(result.saldoAntes ?? 0) - (result.saldoDepois ?? 0)}
                  </p>
                </div>
              </div>

              {/* Citações processadas pelo service */}
              <details open className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                  Citações processadas pelo EscavadorService ({result.citacoesCount})
                </summary>
                <pre className="overflow-auto max-h-96 p-4 text-[11px] font-mono text-slate-700 bg-slate-900/5">
                  {JSON.stringify(result.citacoes, null, 2)}
                </pre>
              </details>

              {/* JSON bruto da API */}
              <details className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                  JSON bruto da API Escavador (payload completo)
                </summary>
                <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700 bg-slate-900/5">
                  {JSON.stringify(result.rawResponse, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  )
}
